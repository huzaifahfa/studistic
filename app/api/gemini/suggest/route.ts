import { NextRequest, NextResponse } from 'next/server'
import { generateStudySuggestion } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { healthMetrics, currentTime, currentTask, pomodoroSession, todos } = body

    if (!healthMetrics) {
      return NextResponse.json({ error: 'Missing health metrics' }, { status: 400 })
    }

    const suggestion = await generateStudySuggestion({
      healthMetrics,
      currentTime: currentTime || new Date().toLocaleTimeString(),
      currentTask,
      pomodoroSession: pomodoroSession || 0,
      todos: todos || [],
    })

    return NextResponse.json(suggestion)
  } catch (error) {
    console.error('Gemini suggestion error:', error)
    // Return fallback suggestion
    return NextResponse.json({
      type: 'break',
      title: 'Take a short break',
      description: 'You\'ve been studying hard. Step away for 5 minutes to refresh your mind.',
      urgency: 'medium',
      action: { label: 'Start Break', data: { duration: 5 } },
      calendarEvent: { title: 'Study Break', duration: 5 },
    })
  }
}
