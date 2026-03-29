import { NextRequest, NextResponse } from 'next/server'
import { getSuggestion } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const { metrics, todos } = await req.json()
    const suggestion = await getSuggestion(metrics, todos ?? [])
    return NextResponse.json(suggestion)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
