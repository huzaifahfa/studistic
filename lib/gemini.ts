import { GoogleGenerativeAI } from '@google/generative-ai'
import type { VitalMetrics } from '@/hooks/useRPPG'

export interface StudySuggestion {
  type: 'pomodoro' | 'break' | 'sleep' | 'hydration' | 'stretch' | 'music' | 'focus'
  title: string
  description: string
  urgency: 'high' | 'medium' | 'low'
  actionLabel: string
}

export async function getSuggestion(
  metrics: VitalMetrics,
  todos: string[],
): Promise<StudySuggestion> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return fallback(metrics)

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `You are a study wellness assistant. A student's biometric data from rPPG camera analysis:
- Heart Rate: ${metrics.heartRate} BPM
- Respiration Rate: ${metrics.respirationRate} breaths/min
- Oxygen Saturation: ${metrics.oxygenSaturation}%
- Stress Level: ${metrics.stressLevel}/100
- Fatigue Level: ${metrics.fatigueLevel}/100
- HRV Score: ${metrics.hrvScore}/100
- Current tasks: ${todos.join(', ') || 'none'}
- Current time: ${new Date().toLocaleTimeString()}

Respond ONLY with a JSON object, no markdown:
{"type":"pomodoro|break|sleep|hydration|stretch|music|focus","title":"short title","description":"1-2 sentence recommendation","urgency":"high|medium|low","actionLabel":"button text"}`

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    const json = text.replace(/^```json?\n?/, '').replace(/```$/, '').trim()
    return JSON.parse(json)
  } catch {
    return fallback(metrics)
  }
}

function fallback(metrics: VitalMetrics): StudySuggestion {
  if (metrics.fatigueLevel > 65)
    return { type: 'break', title: 'Take a Break', description: 'High fatigue detected. A short break will restore your focus.', urgency: 'high', actionLabel: 'Take Break Now' }
  if (metrics.stressLevel > 60)
    return { type: 'stretch', title: 'Quick Stretch', description: 'Elevated stress detected. Stand up and stretch for 2 minutes.', urgency: 'medium', actionLabel: 'Start Stretching' }
  return { type: 'hydration', title: 'Stay Hydrated', description: 'Drink water to maintain peak cognitive performance.', urgency: 'low', actionLabel: 'Got It' }
}
