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

export async function getStudyPlan(
  metrics: VitalMetrics | null,
  todos: string[],
): Promise<StudyPlan> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return fallbackPlan(metrics, todos)

  const now = new Date()
  const in1h = new Date(now.getTime() + 60 * 60000).toISOString()

  try {
    const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: MODEL })
    const prompt =
      `Student data: stress=${metrics?.stressLevel ?? '?'}/100 fatigue=${metrics?.fatigueLevel ?? '?'}/100 hr=${metrics?.heartRate ?? '?'}bpm. Tasks: ${todos.join(',') || 'none'}. Now: ${in1h}.` +
      ` Reply ONLY JSON no markdown: {"summary":"<1 sentence>","items":[` +
      `{"id":"1","type":"pomodoro","title":"<title>","description":"<1 sentence>","pomodoroMinutes":<15-50>},` +
      `{"id":"2","type":"calendar","title":"<title>","description":"<1 sentence>","calendarEvent":{"startTime":"<ISO8601>","durationMinutes":<number>}},` +
      `{"id":"3","type":"tip","category":"study","title":"<title>","description":"<1 sentence>"},` +
      `{"id":"4","type":"tip","category":"mental_health","title":"<title>","description":"<1 sentence>"},` +
      `{"id":"5","type":"tip","category":"time_management","title":"<title>","description":"<1 sentence>"}]}`
    const result = await model.generateContent(prompt)
    return parseJSON<StudyPlan>(result.response.text())
  } catch (e) {
    console.error('[getStudyPlan]', e)
    return fallbackPlan(metrics, todos)
  }
}

function fallback(metrics: VitalMetrics): StudySuggestion {
  if (metrics.fatigueLevel > 65)
    return { type: 'break', title: 'Take a Break', description: 'High fatigue detected. A short break will restore your focus.', urgency: 'high', actionLabel: 'Take Break Now' }
  if (metrics.stressLevel > 60)
    return { type: 'stretch', title: 'Quick Stretch', description: 'Elevated stress detected. Stand up and stretch for 2 minutes.', urgency: 'medium', actionLabel: 'Start Stretching' }
  return { type: 'hydration', title: 'Stay Hydrated', description: 'Drink water to maintain peak cognitive performance.', urgency: 'low', actionLabel: 'Got It' }
}

function fallbackPlan(metrics: VitalMetrics | null, todos: string[]): StudyPlan {
  const now = new Date()
  const in1h = new Date(now.getTime() + 60 * 60000).toISOString()
  const in3h = new Date(now.getTime() + 3 * 60 * 60000).toISOString()
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
