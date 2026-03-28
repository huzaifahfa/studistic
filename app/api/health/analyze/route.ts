import { NextRequest, NextResponse } from 'next/server'
import { analyzeFromFrame } from '@/lib/presage'
import { startCppVitalsProcess } from '@/lib/presageCppProcess'

// Make sure the C++ sidecar is up when this route module loads
startCppVitalsProcess()

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, sessionId } = await req.json()

    if (!imageBase64 || !sessionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const metrics = await analyzeFromFrame(imageBase64, sessionId)

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Health analysis error:', error)
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    )
  }
}
