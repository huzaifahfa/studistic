# StudiStic

StudiStic is an AI-powered study companion that monitors your health in real time using your webcam, and adapts your study environment accordingly. It combines biometric monitoring, ambient focus tools, task management, and Gemini AI to help you study smarter — not harder.

---

## The Problem

Students often push through fatigue and stress without realizing how much it degrades focus and retention. There's no tool that watches your health *while* you study and responds intelligently to what your body is telling you.

## Our Solution

StudiStic uses **rPPG (remote photoplethysmography)** — the same technology used in medical wearables — directly from your webcam. No hardware needed. It reads your heart rate, respiration, stress, and fatigue in real time, then uses Gemini AI to generate personalized study plans and recommendations based on what it finds.

---

## Features

### Biometric Monitoring (rPPG)
- Detects your face via TinyFaceDetector (face-api.js)
- Applies the **POS (Plane-Orthogonal-to-Skin)** algorithm on raw RGB webcam frames
- Measures: Heart Rate (BPM), Respiration Rate, SpO2, HRV Score, Stress Level, Fatigue Level
- All computed locally in the browser — no video is uploaded anywhere
- Automatically saves readings to Firestore every 30 seconds

### AI Study Plan (Google Gemini)
- Hit **Study** in the toolbar to generate a personalized plan
- Gemini reads your live biometrics, historical health averages, task list, study streak, and total hours studied from Firestore
- Outputs a structured plan with:
  - Recommended Pomodoro duration based on your fatigue
  - Google Calendar study session invites (accepted with one click)
  - Study, mental health, and time management tips
  - Task breakdowns — your pending tasks split into actionable steps
- Each item can be **accepted** (applied immediately) or **denied**

### AI Stress Alerts
- When stress > 60 or fatigue > 65, an AI suggestion modal pops up automatically
- Suggests breaks, stretches, hydration, or music based on your specific readings

### Pomodoro Timer
- Modes: 25-min Pomodoro, custom duration, 5-min break
- Alarm with continuous beeping until dismissed
- Session dots track completed pomodoros
- Accepting a study plan timer preset opens the timer pre-configured

### Task Manager
- Add, complete, and delete tasks
- Tasks sync to Firestore and are read by the AI when generating study plans
- Completion and addition events update your study stats

### Notes
- Quick scratchpad widget, persists to localStorage

### Ambient Sounds
- Rain, ocean waves, cafe ambiance — powered by YouTube IFrame API
- Plays at 30% volume, loops

### Spotify
- Paste any Spotify playlist/album/track URL to embed it directly in the dashboard

### Live Backgrounds
- 6 looping video backgrounds: forest, lake, ocean, city, cafe, rain
- Switch backgrounds mid-session without interrupting anything

### Study Stats
- Landing page shows Hours Studied, Tasks Completed, and Current Streak
- Stats persist to both localStorage (offline) and Firestore (cross-device)
- Streak resets if you miss a day

### Google Calendar Integration
- Accept AI-suggested study sessions → instant Google Calendar event
- Requires Google sign-in (OAuth scope: `calendar`)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS, Framer Motion |
| Biometrics | face-api.js, rppg-js (POS algorithm), fft-js |
| AI | Google Gemini API (`gemini-flash-lite-latest`) |
| Auth | NextAuth.js v5, Google OAuth 2.0 |
| Database | Firebase Firestore |
| Calendar | Google Calendar API (googleapis) |
| Ambient Audio | YouTube IFrame API |

---

## How It Works

```
Webcam → face-api.js face detection
       → POS algorithm on RGB frames (64-frame sliding window)
       → FFT frequency analysis
       → Heart Rate, Respiration Rate, SpO2
       → Derived: HRV Score, Stress Level, Fatigue Level
       → Saved to Firestore every 30s
       → Triggers Gemini AI suggestion if stress/fatigue threshold exceeded
       → "Study" button → Gemini reads full Firestore context → personalized plan
```

---

## Setup

### Prerequisites
- Node.js 18+
- A Google Cloud project with these APIs enabled:
  - Google Calendar API
  - Gemini API (Google AI Studio)
  - Firebase (Firestore)

### Environment Variables

Create `.env.local`:

```env
AUTH_SECRET=<random 32+ char string>
GOOGLE_CLIENT_ID=<your OAuth client ID>
GOOGLE_CLIENT_SECRET=<your OAuth client secret>
GEMINI_API_KEY=<your Gemini API key>
```

Firebase config is set in `lib/firebase.ts`.

### Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in with Google, allow camera access, and start studying.

---

## Project Structure

```
app/
  page.tsx                    # Landing page with live stats
  dashboard/page.tsx          # Study dashboard
  api/gemini/suggest/         # Real-time stress suggestion endpoint
  api/gemini/study-plan/      # Full study plan generation endpoint
  api/calendar/add/           # Google Calendar event creation endpoint

components/
  dashboard/Dashboard.tsx     # Main study interface
  camera/CameraMonitor.tsx    # Webcam + rPPG display
  widgets/
    PomodoroTimer.tsx
    TodoList.tsx
    NotesWidget.tsx
    SoundWidget.tsx
    SpotifyEmbed.tsx
    StudyPlanWidget.tsx
  health/HealthPopup.tsx
  ai/AISuggestionModal.tsx

lib/
  gemini.ts                   # Gemini prompt logic
  db.ts                       # Firestore CRUD
  studyStats.ts               # localStorage + Firestore stats sync
  calendar.ts                 # Google Calendar API wrapper
  auth.ts                     # NextAuth + token refresh

hooks/
  useRPPG.ts                  # rPPG processing hook (face detection → vitals)
```

---

## Team

Built at HackPSU Spring 2026.
