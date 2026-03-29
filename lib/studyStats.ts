/**
 * Study stats manager.
 *
 * Writes to localStorage immediately (optimistic, offline-friendly) and
 * fires-and-forgets the same update to Firestore when a uid is supplied.
 * Pass uid from the NextAuth session wherever available.
 */

import * as db from "./db";

const STATS_KEY = "studistic_stats";

interface Stats {
  minutesStudied: number;
  tasksCompleted: number;
  totalTasksAdded: number;
  streak: number;
  lastStudyDate: string;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function load(): Stats {
  if (typeof window === "undefined") {
    return { minutesStudied: 0, tasksCompleted: 0, totalTasksAdded: 0, streak: 0, lastStudyDate: "" };
  }
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw)
      return { minutesStudied: 0, tasksCompleted: 0, totalTasksAdded: 0, streak: 0, lastStudyDate: "", ...JSON.parse(raw) };
  } catch {}
  return { minutesStudied: 0, tasksCompleted: 0, totalTasksAdded: 0, streak: 0, lastStudyDate: "" };
}

function save(s: Stats): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STATS_KEY, JSON.stringify(s));
}

function touchStreak(s: Stats): void {
  const today = todayStr();
  if (s.lastStudyDate === today) return;
  const prev = new Date(today);
  prev.setDate(prev.getDate() - 1);
  const yesterday = prev.toISOString().slice(0, 10);
  s.streak = s.lastStudyDate === yesterday ? s.streak + 1 : 1;
  s.lastStudyDate = today;
}

export function getPublicStats() {
  const s = load();
  return {
    hoursStudied: Math.floor(s.minutesStudied / 60),
    tasksCompleted: s.tasksCompleted,
    totalTasksAdded: s.totalTasksAdded,
    streak: s.streak,
  };
}

export function addStudyMinutes(minutes: number, uid?: string): void {
  const s = load();
  s.minutesStudied += minutes;
  touchStreak(s);
  save(s);
  if (uid) db.addStudyMinutes(uid, minutes).catch(console.error);
}

export function addCompletedTask(uid?: string): void {
  const s = load();
  s.tasksCompleted += 1;
  touchStreak(s);
  save(s);
  if (uid) db.addCompletedTask(uid).catch(console.error);
}

export function addTaskAdded(uid?: string): void {
  const s = load();
  s.totalTasksAdded += 1;
  touchStreak(s);
  save(s);
  if (uid) db.addTaskAdded(uid).catch(console.error);
}

/**
 * Merge Firestore stats into localStorage on first load (after sign-in).
 * Call this once when the user's session is established.
 */
export async function syncFromFirestore(uid: string): Promise<void> {
  try {
    const remote = await db.getStats(uid);
    if (remote.minutesStudied === 0 && remote.streak === 0) return; // nothing to sync
    const local = load();
    // Take the higher value for each counter so we never lose progress
    const merged: Stats = {
      minutesStudied: Math.max(local.minutesStudied, remote.minutesStudied),
      tasksCompleted: Math.max(local.tasksCompleted, remote.tasksCompleted),
      totalTasksAdded: Math.max(local.totalTasksAdded, remote.totalTasksAdded),
      streak: Math.max(local.streak, remote.streak),
      lastStudyDate: local.lastStudyDate > remote.lastStudyDate ? local.lastStudyDate : remote.lastStudyDate,
    };
    save(merged);
  } catch (err) {
    console.error("[studyStats] syncFromFirestore failed:", err);
  }
}
