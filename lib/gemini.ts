import { GoogleGenerativeAI } from '@google/generative-ai'
import type { VitalMetrics } from '@/hooks/useRPPG'

export interface StudySuggestion {
  type: 'pomodoro' | 'break' | 'sleep' | 'hydration' | 'stretch' | 'music' | 'focus'
  title: string
  description: string
  urgency: 'high' | 'medium' | 'low'
  actionLabel: string
}

export interface StudyPlanItem {
  id: string
  type: 'calendar' | 'tip' | 'pomodoro'
  title: string
  description: string
  category?: 'study' | 'mental_health' | 'time_management'
  calendarEvent?: { startTime: string; durationMinutes: number }
  pomodoroMinutes?: number
}

export interface StudyPlan {
  summary: string
  items: StudyPlanItem[]
}

const MODEL = 'gemini-flash-lite-latest'

function parseJSON<T>(text: string): T {
  const clean = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim()
  return JSON.parse(clean)
}

export async function getSuggestion(
  metrics: VitalMetrics,
  todos: string[],
): Promise<StudySuggestion> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return fallback(metrics)

  try {
    const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: MODEL })
    const prompt =
      `Student biometrics: stress=${metrics.stressLevel}/100 fatigue=${metrics.fatigueLevel}/100 hr=${metrics.heartRate}bpm hrv=${metrics.hrvScore}/100. Tasks: ${todos.join(',') || 'none'}.` +
      ` Reply ONLY JSON: {"type":"break|pomodoro|stretch|hydration|sleep|music|focus","title":"<5 words>","description":"<1 sentence>","urgency":"high|medium|low","actionLabel":"<3 words>"}`
    const result = await model.generateContent(prompt)
    return parseJSON<StudySuggestion>(result.response.text())
  } catch {
    return fallback(metrics)
  }
}

export interface BusySlot { start: string; end: string; summary: string }

/** Find the earliest free slot at or after `after` that fits `durationMs` before `before`. */
function findFreeSlot(durationMs: number, after: Date, before: Date, busySlots: BusySlot[]): Date | null {
  const sorted = busySlots
    .map(s => ({ start: new Date(s.start), end: new Date(s.end) }))
    .sort((a, b) => a.start.getTime() - b.start.getTime())

  let cursor = new Date(after)

  for (const busy of sorted) {
    if (busy.end <= cursor) continue // already past this slot
    if (busy.start >= new Date(cursor.getTime() + durationMs)) break // gap fits before this busy slot
    // Overlap — push cursor to end of busy slot
    cursor = new Date(Math.max(cursor.getTime(), busy.end.getTime()))
  }

  const fits = new Date(cursor.getTime() + durationMs) <= before
  return fits ? cursor : null
}

/** Post-process: fix any calendar items that clash with busy slots or fall outside the window. */
function sanitizePlan(plan: StudyPlan, busySlots: BusySlot[], winStart: Date, winEnd: Date): StudyPlan {
  const items = plan.items.map(item => {
    if (item.type !== 'calendar' || !item.calendarEvent) return item

    const durationMs = item.calendarEvent.durationMinutes * 60_000
    let start = new Date(item.calendarEvent.startTime)

    // Clamp to window
    if (start < winStart) start = new Date(winStart)
    const end = new Date(start.getTime() + durationMs)

    // Check for clash or overflow
    const overflows = end > winEnd
    const clashes = busySlots.some(b => {
      const bs = new Date(b.start), be = new Date(b.end)
      return start < be && end > bs
    })

    if (!overflows && !clashes) return item // already fine

    // Try to find the next free slot
    const free = findFreeSlot(durationMs, start, winEnd, busySlots)
    if (!free) {
      // No room — demote to a time-management tip
      return {
        ...item,
        type: 'tip' as const,
        category: 'time_management' as const,
        calendarEvent: undefined,
        description: item.description + ' (No free slot found in your window — try expanding it.)',
      }
    }

    return { ...item, calendarEvent: { startTime: free.toISOString(), durationMinutes: item.calendarEvent.durationMinutes } }
  })

  return { ...plan, items }
}

export async function getStudyPlan(
  metrics: VitalMetrics | null,
  todos: string[],
  busySlots: BusySlot[] = [],
  windowStart?: string,
  windowEnd?: string,
): Promise<StudyPlan> {
  const now = new Date()

  // Clamp window to 07:00–23:00 local time — done here so sanitizePlan always has correct bounds
  const earliest = new Date(now); earliest.setHours(7, 0, 0, 0)
  const latest = new Date(now);   latest.setHours(23, 0, 0, 0)
  const winStart = windowStart
    ? new Date(Math.max(new Date(windowStart).getTime(), earliest.getTime()))
    : (now > earliest ? now : earliest)
  const winEnd = windowEnd
    ? new Date(Math.min(new Date(windowEnd).getTime(), latest.getTime()))
    : latest

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return sanitizePlan(fallbackPlan(metrics, todos, windowStart), busySlots, winStart, winEnd)

  const busyStr = busySlots.length
    ? `Existing calendar events (avoid scheduling during these): ${busySlots.map(s => `"${s.summary}" ${s.start}–${s.end}`).join('; ')}.`
    : 'No existing calendar events.'

  try {
    const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: MODEL })
    const prompt =
      `Student data: stress=${metrics?.stressLevel ?? '?'}/100 fatigue=${metrics?.fatigueLevel ?? '?'}/100 hr=${metrics?.heartRate ?? '?'}bpm. Tasks: ${todos.join(',') || 'none'}. Current time: ${now.toISOString()}.` +
      ` Scheduling window: ${winStart.toISOString()} to ${winEnd.toISOString()} (only schedule within this range).` +
      ` ${busyStr}` +
      ` Reply ONLY JSON no markdown: {"summary":"<1 sentence>","items":[` +
      `{"id":"1","type":"pomodoro","title":"<title>","description":"<1 sentence>","pomodoroMinutes":<15-50>},` +
      `{"id":"2","type":"calendar","title":"<title>","description":"<1 sentence>","calendarEvent":{"startTime":"<ISO8601 within window>","durationMinutes":<number>}},` +
      `{"id":"3","type":"tip","category":"study","title":"<title>","description":"<1 sentence>"},` +
      `{"id":"4","type":"tip","category":"mental_health","title":"<title>","description":"<1 sentence>"},` +
      `{"id":"5","type":"tip","category":"time_management","title":"<title>","description":"<1 sentence>"}]}`
    const result = await model.generateContent(prompt)
    const plan = parseJSON<StudyPlan>(result.response.text())
    return sanitizePlan(plan, busySlots, winStart, winEnd)
  } catch (e) {
    console.error('[getStudyPlan]', e)
    return sanitizePlan(fallbackPlan(metrics, todos, windowStart), busySlots, winStart, winEnd)
  }
}

function fallback(metrics: VitalMetrics): StudySuggestion {
  if (metrics.fatigueLevel > 65)
    return { type: 'break', title: 'Take a Break', description: 'High fatigue detected. A short break will restore your focus.', urgency: 'high', actionLabel: 'Take Break Now' }
  if (metrics.stressLevel > 60)
    return { type: 'stretch', title: 'Quick Stretch', description: 'Elevated stress detected. Stand up and stretch for 2 minutes.', urgency: 'medium', actionLabel: 'Start Stretching' }
  return { type: 'hydration', title: 'Stay Hydrated', description: 'Drink water to maintain peak cognitive performance.', urgency: 'low', actionLabel: 'Got It' }
}

function fallbackPlan(metrics: VitalMetrics | null, todos: string[], windowStart?: string): StudyPlan {
  const now = new Date()
  const base = windowStart ? new Date(windowStart) : now
  const in1h = new Date(base.getTime() + 60 * 60000).toISOString()
  const in3h = new Date(base.getTime() + 3 * 60 * 60000).toISOString()
  const stress = metrics?.stressLevel ?? 50
  const fatigue = metrics?.fatigueLevel ?? 50
  const pomMins = fatigue > 65 ? 20 : stress > 60 ? 25 : 35

  return {
    summary: metrics
      ? `Stress ${stress}/100, fatigue ${fatigue}/100 — here's a plan to keep you on track.`
      : "No health data yet — here's a general study plan to get you started.",
    items: [
      { id: '1', type: 'pomodoro', title: `${pomMins}-Minute Focus Block`, description: `Based on your current state, ${pomMins} minutes is a good session length.`, pomodoroMinutes: pomMins },
      { id: '2', type: 'calendar', title: 'Study Session', description: 'Block off focused study time on your calendar.', calendarEvent: { startTime: in1h, durationMinutes: pomMins } },
      { id: '3', type: 'tip', category: 'study', title: 'Active Recall', description: 'After each section, close your notes and write down everything you remember.' },
      { id: '4', type: 'tip', category: 'mental_health', title: 'Deep Breaths', description: 'Box breathing (4s in, 4s hold, 4s out) lowers cortisol and improves focus.' },
      { id: '5', type: 'tip', category: 'time_management', title: todos.length > 0 ? 'Prioritise Tasks' : 'List Your Tasks', description: todos.length > 0 ? `You have ${todos.length} task(s). Tackle the hardest one first.` : 'Open the Task widget and list what you need to do today.' },
      { id: '6', type: 'calendar', title: 'Break & Review', description: 'Schedule a break after your session to consolidate memory.', calendarEvent: { startTime: in3h, durationMinutes: 15 } },
    ],
  }
}
