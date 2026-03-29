import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { addCalendarEvent } from '@/lib/calendar'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.accessToken)
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { title, description, startTime, durationMinutes } = await req.json()
  try {
    const event = await addCalendarEvent(
      session.accessToken,
      title,
      description ?? '',
      new Date(startTime ?? Date.now()),
      durationMinutes ?? 25,
    )
    return NextResponse.json({ success: true, ...event })
  } catch {
    return NextResponse.json({ error: 'Calendar API failed' }, { status: 500 })
  }
}
