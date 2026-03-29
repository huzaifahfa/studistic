import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { addCalendarEvent } from '@/lib/calendar'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, description, startTime, durationMinutes, accessToken: clientToken } = body

    // Prefer token passed from client (always current), fall back to server session
    let token = clientToken as string | undefined
    if (!token) {
      const session = await auth()
      token = session?.accessToken
    }

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated — sign in with Google first' }, { status: 401 })
    }

    const event = await addCalendarEvent(
      token,
      title,
      description ?? '',
      new Date(startTime ?? Date.now()),
      durationMinutes ?? 25,
    )
    return NextResponse.json({ success: true, ...event })
  } catch (e: any) {
    const detail = e?.response?.data ?? e?.errors ?? String(e)
    console.error('[calendar/add] error:', JSON.stringify(detail))
    return NextResponse.json({ error: detail }, { status: 500 })
  }
}
