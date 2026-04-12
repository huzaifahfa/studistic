import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getCalendarEvents } from '@/lib/calendar'

export async function GET(req: NextRequest) {
  try {
    const tokenParam = req.nextUrl.searchParams.get('accessToken')
    let token = tokenParam ?? undefined
    if (!token) {
      const session = await auth()
      token = session?.accessToken
    }
    if (!token) return NextResponse.json({ events: [] })

    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 3600_000)
    const events = await getCalendarEvents(token, now.toISOString(), tomorrow.toISOString())
    return NextResponse.json({ events })
  } catch (e: any) {
    const detail = e?.response?.data ?? String(e)
    console.error('[calendar/events]', detail)
    return NextResponse.json({ events: [] })
  }
}
