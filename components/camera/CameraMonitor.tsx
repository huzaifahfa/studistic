'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, CameraOff, Minimize2, Maximize2, Activity, Wind, Heart } from 'lucide-react'
import { useRPPG, type VitalMetrics } from '@/hooks/useRPPG'

interface Props {
  onMetricsUpdate: (m: VitalMetrics) => void
  onDisable: () => void
}

export default function CameraMonitor({ onMetricsUpdate, onDisable }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [minimized, setMinimized] = useState(false)
  const [hasCamera, setHasCamera] = useState(false)

  const { metrics, isProcessing, modelsLoaded } = useRPPG({ videoRef, enabled: hasCamera })

  // Notify parent when metrics update
  useEffect(() => {
    if (metrics) onMetricsUpdate(metrics)
  }, [metrics, onMetricsUpdate])

  // Start webcam
  useEffect(() => {
    let mounted = true
    navigator.mediaDevices
      .getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' } })
      .then((s) => {
        if (!mounted) return
        setStream(s)
        setHasCamera(true)
        if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play() }
      })
      .catch((err) => {
        if (!mounted) return
        setCameraError(err.name === 'NotAllowedError' ? 'Camera permission denied' : 'Camera unavailable')
      })
    return () => { mounted = false }
  }, [])

  useEffect(() => () => { stream?.getTracks().forEach(t => t.stop()) }, [stream])

  const statusLabel = !modelsLoaded
    ? 'Loading models...'
    : isProcessing
    ? 'Computing...'
    : metrics
    ? 'Live rPPG'
    : 'Sampling...'

  if (cameraError) {
    return (
      <div className="glass rounded-2xl border border-white/10 p-3 flex items-center gap-2">
        <CameraOff className="w-4 h-4 text-red-400" />
        <div>
          <p className="text-xs text-white/50">{cameraError}</p>
          <button onClick={onDisable} className="text-[10px] text-red-400 hover:text-red-300">Dismiss</button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass rounded-2xl border border-white/10 overflow-hidden"
      style={{ width: minimized ? 'auto' : 200 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-1.5">
          <motion.div
            animate={{ opacity: isProcessing ? [1, 0.3, 1] : 1 }}
            transition={{ repeat: isProcessing ? Infinity : 0, duration: 1 }}
            className="w-2 h-2 rounded-full bg-green-400"
            style={{ boxShadow: '0 0 6px #22c55e' }}
          />
          <span className="text-xs text-white/60 font-medium">{statusLabel}</span>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setMinimized(v => !v)} className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60">
            {minimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
          </button>
          <button onClick={onDisable} className="p-1 rounded hover:bg-red-500/20 text-white/30 hover:text-red-400">
            <CameraOff className="w-3 h-3" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {!minimized && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            {/* Video preview */}
            <div className="relative">
              <video ref={videoRef} autoPlay muted playsInline className="w-full object-cover" style={{ height: 150, transform: 'scaleX(-1)' }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/image-frame.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none' }} />
              {/* Scanning line */}
              {isProcessing && (
                <motion.div
                  animate={{ y: ['0%', '100%', '0%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute left-0 right-0 h-0.5 bg-green-400/60"
                  style={{ boxShadow: '0 0 8px rgba(34,197,94,0.8)' }}
                />
              )}
              {/* Loading overlay */}
              {!modelsLoaded && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto mb-1" />
                    <p className="text-[10px] text-white/50">Loading rPPG</p>
                  </div>
                </div>
              )}
            </div>

            {/* Metrics */}
            {metrics && (
              <div className="p-3 space-y-2">
                <MetricRow label="Heart Rate" value={`${metrics.heartRate} BPM`} icon={Heart} color={metrics.heartRate > 90 ? '#f87171' : '#34d399'} pct={metrics.heartRate / 120} />
                <MetricRow label="Respiration" value={`${metrics.respirationRate} br/min`} icon={Wind} color="#34d399" pct={metrics.respirationRate / 25} />
                <MetricRow label="Stress" value={`${metrics.stressLevel}%`} icon={Activity} color={metrics.stressLevel > 60 ? '#f87171' : metrics.stressLevel > 35 ? '#fbbf24' : '#34d399'} pct={metrics.stressLevel / 100} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function MetricRow({ label, value, icon: Icon, color, pct }: { label: string; value: string; icon: React.ElementType; color: string; pct: number }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-0.5">
        <div className="flex items-center gap-1">
          <Icon className="w-2.5 h-2.5" style={{ color }} />
          <span className="text-[10px] text-white/40">{label}</span>
        </div>
        <span className="text-[10px] font-semibold" style={{ color }}>{value}</span>
      </div>
      <div className="h-1 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct * 100, 100)}%` }}
          transition={{ duration: 0.5 }}
          className="h-full rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}80` }}
        />
      </div>
    </div>
  )
}
