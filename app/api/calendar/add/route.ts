import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { addStudyEvent } from '@/lib/calendar'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { title, description, startTime, duration, colorId } = body

    if (!title || !duration) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const eventData = await addStudyEvent(session.accessToken, {
      title,
      description,
      startTime: startTime || new Date().toISOString(),
      duration,
      colorId,
    })

    return NextResponse.json({ success: true, eventId: eventData.id, htmlLink: eventData.htmlLink })
  } catch (error) {
    console.error('Calendar add error:', error)
    return NextResponse.json({ error: 'Failed to add calendar event' }, { status: 500 })
  }
}
