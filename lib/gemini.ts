import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export interface StudySuggestion {
  type: 'pomodoro' | 'break' | 'sleep' | 'hydration' | 'stretch' | 'music' | 'focus'
  title: string
  description: string
  action?: {
    label: string
    data: Record<string, unknown>
  }
  urgency: 'low' | 'medium' | 'high'
  calendarEvent?: {
    title: string
    duration: number // minutes
    startTime?: string
  }
}

export async function generateStudySuggestion(params: {
  healthMetrics: {
    heartRate: number
    stressLevel: number
    eyeConcentration: number
    fatigueLevel: number
    hrvScore: number
  }
  currentTime: string
  currentTask?: string
  pomodoroSession: number
  todos: string[]
}): Promise<StudySuggestion> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `You are an AI wellness and productivity coach for a study app. Analyze this data and provide ONE specific, actionable suggestion.

Current time: ${params.currentTime}
Pomodoro sessions completed today: ${params.pomodoroSession}
Current task: ${params.currentTask || 'Not specified'}
Pending todos: ${params.todos.slice(0, 3).join(', ') || 'None'}

Health metrics from camera analysis:
- Heart rate: ${params.healthMetrics.heartRate} BPM
- Stress level: ${params.healthMetrics.stressLevel}/100
- Eye concentration: ${params.healthMetrics.eyeConcentration}/100
- Fatigue level: ${params.healthMetrics.fatigueLevel}/100
- HRV score: ${params.healthMetrics.hrvScore}/100

Respond ONLY with valid JSON in this exact format:
{
  "type": "pomodoro|break|sleep|hydration|stretch|music|focus",
  "title": "Short title (max 8 words)",
  "description": "Friendly, specific description (max 40 words)",
  "urgency": "low|medium|high",
  "action": {
    "label": "Button text (max 4 words)",
    "data": { "duration": 25, "startTime": "HH:MM" }
  },
  "calendarEvent": {
    "title": "Calendar event title",
    "duration": 25
  }
}`

  const result = await model.generateContent(prompt)
  const text = result.response.text()

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Invalid Gemini response')

  return JSON.parse(jsonMatch[0]) as StudySuggestion
}
