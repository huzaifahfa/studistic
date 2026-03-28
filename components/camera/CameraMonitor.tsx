'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, CameraOff, Minimize2, Maximize2, Activity, Eye, Brain } from 'lucide-react'
import { useHealthMonitor } from '@/hooks/useHealthMonitor'
import type { HealthMetrics } from '@/lib/presage'

interface CameraMonitorProps {
  onHealthUpdate: (metrics: HealthMetrics) => void
  onDisable: () => void
}

export default function CameraMonitor({ onHealthUpdate, onDisable }: CameraMonitorProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [minimized, setMinimized] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)

  const { metrics, isAnalyzing, lastAnalysis, analyzeHealth } = useHealthMonitor({
    videoRef,
    intervalMs: 60000,
    enabled: hasPermission,
  })

  // Notify parent when metrics update
  useEffect(() => {
    if (metrics) onHealthUpdate(metrics)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metrics])

  useEffect(() => {
    let mounted = true
    navigator.mediaDevices
      .getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' } })
      .then((s) => {
        if (!mounted) return
        setStream(s)
        setHasPermission(true)
        if (videoRef.current) {
          videoRef.current.srcObject = s
          videoRef.current.play()
        }
      })
      .catch((err) => {
        if (!mounted) return
        setCameraError(err.name === 'NotAllowedError' ? 'Camera permission denied' : 'Camera unavailable')
      })
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [stream])

  const MetricBadge = ({ icon: Icon, label, value, color }: {
    icon: React.ElementType; label: string; value: string; color: string
  }) => (
    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/40">
      <Icon className="w-2.5 h-2.5" style={{ color }} />
      <span className="text-[10px] text-white/60">{label}</span>
      <span className="text-[10px] font-bold text-white">{value}</span>
    </div>
  )

  if (cameraError) {
    return (
      <div className="glass rounded-2xl border border-white/10 p-3 flex items-center gap-2">
        <CameraOff className="w-4 h-4 text-red-400" />
        <div>
          <p className="text-xs text-white/50">{cameraError}</p>
          <button onClick={onDisable} className="text-[10px] text-red-400 hover:text-red-300 transition-colors">
            Dismiss
          </button>
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
            animate={{ opacity: isAnalyzing ? [1, 0.3, 1] : 1 }}
            transition={{ repeat: isAnalyzing ? Infinity : 0, duration: 1 }}
            className="w-2 h-2 rounded-full bg-green-400"
            style={{ boxShadow: '0 0 6px #22c55e' }}
          />
          <span className="text-xs text-white/60 font-medium">
            {isAnalyzing ? 'Analyzing...' : 'Live Health'}
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setMinimized((v) => !v)}
            className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors"
          >
            {minimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
          </button>
          <button
            onClick={onDisable}
            className="p-1 rounded hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"
          >
            <CameraOff className="w-3 h-3" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {!minimized && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            {/* Camera preview */}
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full object-cover"
                style={{ height: 120, transform: 'scaleX(-1)' }}
              />
              {/* Overlay metrics on video */}
              {metrics && (
                <div className="absolute bottom-1 left-1 right-1 flex flex-wrap gap-1">
                  <MetricBadge icon={Activity} label="BPM" value={`${metrics.heartRate}`} color="#f87171" />
                  <MetricBadge icon={Brain} label="Stress" value={`${metrics.stressLevel}%`} color="#a78bfa" />
                  <MetricBadge icon={Eye} label="Focus" value={`${metrics.eyeConcentration}%`} color="#34d399" />
                </div>
              )}
              {/* Scanning animation */}
              {isAnalyzing && (
                <motion.div
                  animate={{ y: ['0%', '100%', '0%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute left-0 right-0 h-0.5 bg-green-400/60"
                  style={{ boxShadow: '0 0 8px rgba(34,197,94,0.8)' }}
                />
              )}
            </div>

            {/* Metrics panel */}
            {metrics && (
              <div className="p-3 space-y-1.5">
                <MetricRow label="Heart Rate" value={`${metrics.heartRate} BPM`} color={metrics.heartRate > 90 ? '#f87171' : '#34d399'} pct={metrics.heartRate / 120} />
                <MetricRow label="Stress" value={`${metrics.stressLevel}%`} color={metrics.stressLevel > 60 ? '#f87171' : metrics.stressLevel > 35 ? '#fbbf24' : '#34d399'} pct={metrics.stressLevel / 100} />
                <MetricRow label="Focus" value={`${metrics.eyeConcentration}%`} color={metrics.eyeConcentration < 40 ? '#f87171' : '#34d399'} pct={metrics.eyeConcentration / 100} />
                <MetricRow label="Fatigue" value={`${metrics.fatigueLevel}%`} color={metrics.fatigueLevel > 60 ? '#f87171' : '#fbbf24'} pct={metrics.fatigueLevel / 100} />
              </div>
            )}

            {/* Analyze now button */}
            <div className="px-3 pb-3">
              <button
                onClick={() => analyzeHealth()}
                disabled={isAnalyzing}
                className="w-full py-1.5 rounded-xl text-xs font-medium bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:bg-violet-500/30 transition-colors disabled:opacity-40 flex items-center justify-center gap-1"
              >
                <Camera className="w-3 h-3" />
                {isAnalyzing ? 'Analyzing...' : 'Analyze Now'}
              </button>
              {lastAnalysis && (
                <p className="text-center text-[10px] text-white/20 mt-1">
                  Last: {lastAnalysis.toLocaleTimeString()}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function MetricRow({ label, value, color, pct }: { label: string; value: string; color: string; pct: number }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-[10px] text-white/40">{label}</span>
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
