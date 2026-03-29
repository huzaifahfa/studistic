/**
 * Firestore database service for Studistic.
 *
 * Collections (all nested under users/{userId}):
 *   users/{userId}                      — profile + calendar sync info
 *   users/{userId}/stats                — aggregated study stats (single doc)
 *   users/{userId}/biometricReadings    — individual rPPG snapshots
 *   users/{userId}/studySessions        — completed Pomodoro / free-study blocks
 *   users/{userId}/tasks                — to-do items
 *   users/{userId}/calendarEvents       — events pushed to Google Calendar
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  increment,
  Timestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  createdAt: Timestamp | null;
  googleCalendarSynced: boolean;
}

export interface UserStats {
  minutesStudied: number;
  tasksCompleted: number;
  totalTasksAdded: number;
  streak: number;
  lastStudyDate: string; // "YYYY-MM-DD"
  updatedAt: Timestamp | null;
}

/** One rPPG snapshot captured during a study session */
export interface BiometricReading {
  id?: string;
  heartRate: number;         // BPM
  respirationRate: number;   // breaths / min
  oxygenSaturation: number;  // %
  stressLevel: number;       // 0-100
  fatigueLevel: number;      // 0-100
  hrvScore: number;          // 0-100
  sessionId?: string;        // links to a StudySession document
  capturedAt: Timestamp | null;
}

/** Aggregated summary of a single study block */
export interface StudySession {
  id?: string;
  type: "pomodoro" | "free";
  durationMinutes: number;
  startedAt: Timestamp | null;
  endedAt: Timestamp | null;
  /** Rolling averages computed from biometric readings in this session */
  avgHeartRate?: number;
  avgRespirationRate?: number;
  avgStressLevel?: number;
  avgFatigueLevel?: number;
  avgHrvScore?: number;
  tasksCompleted: number;
  notes?: string;
}

export interface Task {
  id?: string;
  text: string;
  completed: boolean;
  createdAt: Timestamp | null;
  completedAt?: Timestamp | null;
}

export interface CalendarEvent {
  id?: string;
  googleEventId: string;
  title: string;
  description?: string;
  startTime: Timestamp | null;
  durationMinutes: number;
  createdAt: Timestamp | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function userRef(uid: string) {
  return doc(db, "users", uid);
}

function statsRef(uid: string) {
  return doc(db, "users", uid, "stats", "aggregate");
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── User Profile ─────────────────────────────────────────────────────────────

/**
 * Create or update a user document on sign-in.
 * Uses setDoc with merge so existing fields aren't overwritten.
 */
export async function upsertUser(
  uid: string,
  data: Pick<UserProfile, "email" | "name" | "photoURL">
): Promise<void> {
  const ref = userRef(uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid,
      ...data,
      createdAt: serverTimestamp(),
      googleCalendarSynced: false,
    });
  } else {
    await updateDoc(ref, { ...data });
  }
}

export async function getUser(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(userRef(uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function setCalendarSynced(uid: string, synced: boolean): Promise<void> {
  await updateDoc(userRef(uid), { googleCalendarSynced: synced });
}

// ─── Study Stats ──────────────────────────────────────────────────────────────

/** Returns current stats or sensible defaults. */
export async function getStats(uid: string): Promise<UserStats> {
  const snap = await getDoc(statsRef(uid));
  if (snap.exists()) return snap.data() as UserStats;
  return {
    minutesStudied: 0,
    tasksCompleted: 0,
    totalTasksAdded: 0,
    streak: 0,
    lastStudyDate: "",
    updatedAt: null,
  };
}

/**
 * Adds studied minutes and updates the streak.
 * Safe to call from client after a Pomodoro completes.
 */
export async function addStudyMinutes(uid: string, minutes: number): Promise<void> {
  const ref = statsRef(uid);
  const snap = await getDoc(ref);
  const today = todayStr();

  if (!snap.exists()) {
    await setDoc(ref, {
      minutesStudied: minutes,
      tasksCompleted: 0,
      totalTasksAdded: 0,
      streak: 1,
      lastStudyDate: today,
      updatedAt: serverTimestamp(),
    });
    return;
  }

  const data = snap.data() as UserStats;
  const streakUpdate = computeStreak(data.streak, data.lastStudyDate, today);

  await updateDoc(ref, {
    minutesStudied: increment(minutes),
    streak: streakUpdate,
    lastStudyDate: today,
    updatedAt: serverTimestamp(),
  });
}

export async function addCompletedTask(uid: string): Promise<void> {
  const ref = statsRef(uid);
  const snap = await getDoc(ref);
  const today = todayStr();

  if (!snap.exists()) {
    await setDoc(ref, {
      minutesStudied: 0,
      tasksCompleted: 1,
      totalTasksAdded: 0,
      streak: 1,
      lastStudyDate: today,
      updatedAt: serverTimestamp(),
    });
    return;
  }

  const data = snap.data() as UserStats;
  const streakUpdate = computeStreak(data.streak, data.lastStudyDate, today);

  await updateDoc(ref, {
    tasksCompleted: increment(1),
    streak: streakUpdate,
    lastStudyDate: today,
    updatedAt: serverTimestamp(),
  });
}

export async function addTaskAdded(uid: string): Promise<void> {
  const ref = statsRef(uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      minutesStudied: 0,
      tasksCompleted: 0,
      totalTasksAdded: 1,
      streak: 0,
      lastStudyDate: "",
      updatedAt: serverTimestamp(),
    });
    return;
  }

  await updateDoc(ref, {
    totalTasksAdded: increment(1),
    updatedAt: serverTimestamp(),
  });
}

function computeStreak(currentStreak: number, lastDate: string, today: string): number {
  if (lastDate === today) return currentStreak;
  const prev = new Date(today);
  prev.setDate(prev.getDate() - 1);
  const yesterday = prev.toISOString().slice(0, 10);
  return lastDate === yesterday ? currentStreak + 1 : 1;
}

// ─── Biometric Readings ───────────────────────────────────────────────────────

/**
 * Stores a single rPPG snapshot.
 * Call this every N seconds while a study session is active.
 */
export async function saveBiometricReading(
  uid: string,
  reading: Omit<BiometricReading, "id" | "capturedAt">
): Promise<string> {
  const col = collection(db, "users", uid, "biometricReadings");
  const ref = await addDoc(col, {
    ...reading,
    capturedAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Fetch the most recent N biometric readings for trend analysis.
 */
export async function getRecentBiometrics(
  uid: string,
  count = 20
): Promise<BiometricReading[]> {
  const col = collection(db, "users", uid, "biometricReadings");
  const q = query(col, orderBy("capturedAt", "desc"), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as BiometricReading));
}

/**
 * Fetch all biometric readings for a specific study session.
 */
export async function getBiometricsBySession(
  uid: string,
  sessionId: string
): Promise<BiometricReading[]> {
  const col = collection(db, "users", uid, "biometricReadings");
  const q = query(col, where("sessionId", "==", sessionId), orderBy("capturedAt", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as BiometricReading));
}

// ─── Study Sessions ───────────────────────────────────────────────────────────

/**
 * Open a new study session when a Pomodoro or free-study block starts.
 * Returns the new document ID to associate with biometric readings.
 */
export async function startStudySession(
  uid: string,
  type: StudySession["type"]
): Promise<string> {
  const col = collection(db, "users", uid, "studySessions");
  const ref = await addDoc(col, {
    type,
    durationMinutes: 0,
    startedAt: serverTimestamp(),
    endedAt: null,
    tasksCompleted: 0,
  });
  return ref.id;
}

/**
 * Close a study session with final aggregated metrics.
 */
export async function endStudySession(
  uid: string,
  sessionId: string,
  data: Pick<
    StudySession,
    | "durationMinutes"
    | "avgHeartRate"
    | "avgRespirationRate"
    | "avgStressLevel"
    | "avgFatigueLevel"
    | "avgHrvScore"
    | "tasksCompleted"
    | "notes"
  >
): Promise<void> {
  const ref = doc(db, "users", uid, "studySessions", sessionId);
  await updateDoc(ref, { ...data, endedAt: serverTimestamp() });
}

/**
 * Fetch the N most recent completed study sessions (for study-plan analysis).
 */
export async function getRecentStudySessions(
  uid: string,
  count = 10
): Promise<StudySession[]> {
  const col = collection(db, "users", uid, "studySessions");
  const q = query(col, orderBy("startedAt", "desc"), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as StudySession));
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function addTask(uid: string, text: string): Promise<string> {
  const col = collection(db, "users", uid, "tasks");
  const ref = await addDoc(col, {
    text,
    completed: false,
    createdAt: serverTimestamp(),
    completedAt: null,
  });
  return ref.id;
}

export async function completeTask(uid: string, taskId: string): Promise<void> {
  const ref = doc(db, "users", uid, "tasks", taskId);
  await updateDoc(ref, { completed: true, completedAt: serverTimestamp() });
}

export async function deleteTask(uid: string, taskId: string): Promise<void> {
  const ref = doc(db, "users", uid, "tasks", taskId);
  // soft-delete by marking; use writeBatch if you need a hard delete
  const batch = writeBatch(db);
  batch.delete(ref);
  await batch.commit();
}

export async function getTasks(uid: string): Promise<Task[]> {
  const col = collection(db, "users", uid, "tasks");
  const q = query(col, orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task));
}

// ─── Calendar Events ──────────────────────────────────────────────────────────

/**
 * Record a Google Calendar event that was created from an AI suggestion.
 */
export async function saveCalendarEvent(
  uid: string,
  event: Omit<CalendarEvent, "id" | "createdAt">
): Promise<string> {
  const col = collection(db, "users", uid, "calendarEvents");
  const ref = await addDoc(col, { ...event, createdAt: serverTimestamp() });
  return ref.id;
}

export async function getCalendarEvents(uid: string, count = 20): Promise<CalendarEvent[]> {
  const col = collection(db, "users", uid, "calendarEvents");
  const q = query(col, orderBy("startTime", "desc"), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CalendarEvent));
}

// ─── Study Plan Analysis Helpers ─────────────────────────────────────────────

/**
 * Returns a rolling average of biometric readings over the last N sessions —
 * useful for feeding into the Gemini study-plan prompt.
 */
export async function getBiometricSummary(
  uid: string,
  readingCount = 50
): Promise<{
  avgHeartRate: number;
  avgRespirationRate: number;
  avgStressLevel: number;
  avgFatigueLevel: number;
  avgHrvScore: number;
}> {
  const readings = await getRecentBiometrics(uid, readingCount);

  if (readings.length === 0) {
    return {
      avgHeartRate: 0,
      avgRespirationRate: 0,
      avgStressLevel: 0,
      avgFatigueLevel: 0,
      avgHrvScore: 0,
    };
  }

  const sum = readings.reduce(
    (acc, r) => ({
      heartRate: acc.heartRate + r.heartRate,
      respirationRate: acc.respirationRate + r.respirationRate,
      stressLevel: acc.stressLevel + r.stressLevel,
      fatigueLevel: acc.fatigueLevel + r.fatigueLevel,
      hrvScore: acc.hrvScore + r.hrvScore,
    }),
    { heartRate: 0, respirationRate: 0, stressLevel: 0, fatigueLevel: 0, hrvScore: 0 }
  );

  const n = readings.length;
  return {
    avgHeartRate: Math.round(sum.heartRate / n),
    avgRespirationRate: Math.round(sum.respirationRate / n),
    avgStressLevel: Math.round(sum.stressLevel / n),
    avgFatigueLevel: Math.round(sum.fatigueLevel / n),
    avgHrvScore: Math.round(sum.hrvScore / n),
  };
}
