'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { HealthMetrics } from '@/lib/presage'

interface UseHealthMonitorOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>
  intervalMs?: number
  enabled?: boolean
}

interface HealthMonitorState {
  metrics: HealthMetrics | null
  isAnalyzing: boolean
  lastAnalysis: Date | null
  error: string | null
  sessionId: string
}

export function useHealthMonitor({ videoRef, intervalMs = 60000, enabled = true }: UseHealthMonitorOptions) {
  const [state, setState] = useState<HealthMonitorState>({
    metrics: null,
    isAnalyzing: false,
    lastAnalysis: null,
    error: null,
    sessionId: `session-${Date.now()}`,
  })

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return null

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas')
    }

    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(video, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.7).split(',')[1]
  }, [videoRef])

  const analyzeHealth = useCallback(async () => {
    if (state.isAnalyzing) return

    const imageBase64 = captureFrame()
    if (!imageBase64) {
      // If no camera frame, still fetch mock metrics
    }

    setState((prev) => ({ ...prev, isAnalyzing: true, error: null }))

    try {
      const response = await fetch('/api/health/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageBase64 || '',
          sessionId: state.sessionId,
        }),
      })

      if (!response.ok) throw new Error('Analysis failed')

      const metrics: HealthMetrics = await response.json()

      setState((prev) => ({
        ...prev,
        metrics,
        isAnalyzing: false,
        lastAnalysis: new Date(),
      }))

      return metrics
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }))
      return null
    }
  }, [captureFrame, state.isAnalyzing, state.sessionId])

  useEffect(() => {
    if (!enabled) return

    // Initial analysis after 5s
    const initTimer = setTimeout(analyzeHealth, 5000)

    // Recurring analysis
    intervalRef.current = setInterval(analyzeHealth, intervalMs)

    return () => {
      clearTimeout(initTimer)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, intervalMs])

  const isLateNight = () => {
    const hour = new Date().getHours()
    return hour >= 23 || hour < 6
  }

  return {
    ...state,
    analyzeHealth,
    captureFrame,
    isLateNight: isLateNight(),
  }
}
