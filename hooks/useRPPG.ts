'use client'

import { useState, useRef, useEffect } from 'react'

export interface VitalMetrics {
  heartRate: number
  respirationRate: number
  oxygenSaturation: number
  stressLevel: number
  fatigueLevel: number
  hrvScore: number
  timestamp: number
}

interface UseRPPGOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>
  enabled?: boolean
}

// POS needs signal.length > POS_WINDOW + 50 (it slices off 50 internally).
// Buffer must also be a power of 2 for FFT.
const BUFFER_SIZE = 128         // total frames kept (power-of-2 for FFT)
const POS_WINDOW = 64           // sliding window inside POS
const SLIDE_AMOUNT = 32         // how many frames to drop after each compute
const SAMPLE_INTERVAL_MS = 66   // ~15 fps

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type POSFn = (signal: any[], windowSize: number) => any[]

export function useRPPG({ videoRef, enabled = true }: UseRPPGOptions) {
  const [metrics, setMetrics] = useState<VitalMetrics | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signalBuffer = useRef<{ R: number; G: number; B: number }[]>([])
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const faceApiRef = useRef<typeof import('face-api.js') | null>(null)
  const posRef = useRef<POSFn | null>(null)
  const busyRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load face-api.js models + POS algorithm
  useEffect(() => {
    if (!enabled) return
    let cancelled = false

    async function loadModels() {
      try {
        const faceapi = await import('face-api.js')
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/weights'),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri('/weights'),
        ])
        if (!cancelled) {
          faceApiRef.current = faceapi
          setModelsLoaded(true)
        }
      } catch {
        if (!cancelled) setError('Failed to load face detection models')
      }
    }

    async function loadPOS() {
      try {
        const mod = await import('@/lib/rppg/pos')
        if (mod.POS) posRef.current = mod.POS as POSFn
      } catch (e) {
        console.warn('POS algorithm failed to load:', e)
      }
    }

    loadModels()
    loadPOS()
    return () => { cancelled = true }
  }, [enabled])

  // Sampling loop — uses a ref-based guard so the interval never goes stale
  useEffect(() => {
    if (!enabled || !modelsLoaded) return

    timerRef.current = setInterval(() => { sampleAndCompute() }, SAMPLE_INTERVAL_MS)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, modelsLoaded])

  async function sampleAndCompute() {
    // Skip if a previous frame is still being processed (async face detection)
    if (busyRef.current) return
    const video = videoRef.current
    const faceapi = faceApiRef.current
    if (!video || !video.videoWidth || !faceapi) return

    busyRef.current = true
    try {
      // Draw frame to offscreen canvas
      if (!canvasRef.current) canvasRef.current = document.createElement('canvas')
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(video, 0, 0)

      // Detect face
      const detection = await faceapi.detectSingleFace(
        canvas,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.4 })
      )

      let R = 0, G = 0, B = 0

      if (!detection) return

      const { x, y, width, height } = detection.box
      const imageData = ctx.getImageData(
        Math.max(0, Math.floor(x)),
        Math.max(0, Math.floor(y)),
        Math.min(canvas.width - Math.floor(x), Math.floor(width)),
        Math.min(canvas.height - Math.floor(y), Math.floor(height))
      )
      const px = imageData.data
      let n = 0
      for (let i = 0; i < px.length; i += 4) {
        R += px[i]; G += px[i + 1]; B += px[i + 2]; n++
      }
      if (n > 0) { R /= n; G /= n; B /= n }

      signalBuffer.current.push({ R, G, B })

      // Compute vitals once we have enough frames
      if (signalBuffer.current.length >= BUFFER_SIZE) {
        computeVitals(signalBuffer.current.slice(-BUFFER_SIZE))
        // Slide forward
        signalBuffer.current = signalBuffer.current.slice(SLIDE_AMOUNT)
      }
    } finally {
      busyRef.current = false
    }
  }

  function computeVitals(signal: { R: number; G: number; B: number }[]) {
    setIsProcessing(true)
    try {
      let heartRate = 0
      let respirationRate = 0
      let oxygenSaturation = 0

      if (posRef.current) {
        const result = posRef.current(signal, POS_WINDOW)
        const bpm = result[2] as number
        const rr = result[3] as number
        const oSat = result[4] as number
        if (bpm > 0) heartRate = Math.round(bpm)
        if (rr > 0) respirationRate = Math.round(rr)
        if (oSat > 0) oxygenSaturation = Math.round(oSat)
      }

      // Only update metrics when we got real data from POS
      if (heartRate <= 0 && respirationRate <= 0) return

      const hrvScore = Math.max(20, Math.min(100, Math.round(100 - (heartRate - 60) * 0.8)))
      const stressLevel = Math.max(0, Math.min(100, Math.round((heartRate - 60) * 0.6 + (respirationRate - 14) * 1.5)))
      const fatigueLevel = Math.max(0, Math.min(100, Math.round((100 - hrvScore) * 0.5 + (18 - respirationRate) * 1.5)))

      setMetrics({ heartRate, respirationRate, oxygenSaturation, stressLevel, fatigueLevel, hrvScore, timestamp: Date.now() })
    } finally {
      setIsProcessing(false)
    }
  }

  return { metrics, isProcessing, modelsLoaded, error }
}
