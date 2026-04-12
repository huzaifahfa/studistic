import { NextRequest, NextResponse } from 'next/server'
import { getStudyPlan } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const { metrics, todos, busySlots, windowStart, windowEnd } = await req.json()
    const plan = await getStudyPlan(metrics ?? null, todos ?? [], busySlots ?? [], windowStart, windowEnd)
    return NextResponse.json(plan)
  } catch (e) {
    console.error('[study-plan]', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
