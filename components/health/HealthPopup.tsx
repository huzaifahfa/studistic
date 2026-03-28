'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Heart, Brain, Eye, Zap, Wind } from 'lucide-react'
import type { HealthMetrics } from '@/lib/presage'

interface HealthPopupProps {
  metrics: HealthMetrics
  onDismiss: () => void
}

function getColor(value: number, inverse = false): string {
  const bad = inverse ? value < 40 : value > 70
  const warn = inverse ? value < 60 : value > 40
  if (bad) return '#f87171'
  if (warn) return '#fbbf24'
  return '#34d399'
}

export default function HealthPopup({ metrics, onDismiss }: HealthPopupProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 12000)
    return () => clearTimeout(t)
  }, [onDismiss])

  const cards = [
    {
      icon: Heart,
      label: 'Heart Rate',
      value: `${metrics.heartRate} BPM`,
      color: getColor(metrics.heartRate, false),
      pct: metrics.heartRate / 120,
      detail: metrics.heartRate < 60 ? 'Low' : metrics.heartRate > 90 ? 'Elevated' : 'Normal',
    },
    {
      icon: Brain,
      label: 'Stress',
      value: `${metrics.stressLevel}%`,
      color: getColor(metrics.stressLevel),
      pct: metrics.stressLevel / 100,
      detail: metrics.stressLevel < 30 ? 'Calm' : metrics.stressLevel < 60 ? 'Moderate' : 'High stress',
    },
    {
      icon: Eye,
      label: 'Focus',
      value: `${metrics.eyeConcentration}%`,
      color: getColor(metrics.eyeConcentration, true),
      pct: metrics.eyeConcentration / 100,
      detail: metrics.eyeConcentration > 70 ? 'Focused' : metrics.eyeConcentration > 40 ? 'Moderate' : 'Distracted',
    },
    {
      icon: Zap,
      label: 'Fatigue',
      value: `${metrics.fatigueLevel}%`,
      color: getColor(metrics.fatigueLevel),
      pct: metrics.fatigueLevel / 100,
      detail: metrics.fatigueLevel < 30 ? 'Fresh' : metrics.fatigueLevel < 60 ? 'Mild' : 'Tired',
    },
    {
      icon: Wind,
      label: 'Breath Rate',
      value: `${metrics.respirationRate}/min`,
      color: '#60a5fa',
      pct: metrics.respirationRate / 25,
      detail: 'Normal range: 12-20',
    },
  ]

  return (
    <motion.div
      initial={{ x: '110%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '110%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className="fixed right-6 top-24 z-50 w-72 glass rounded-2xl border border-white/10 overflow-hidden"
      style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="w-2.5 h-2.5 rounded-full bg-green-400"
            style={{ boxShadow: '0 0 8px #22c55e' }}
          />
          <span className="text-sm font-bold text-white/80">Health Check</span>
        </div>
        <button onClick={onDismiss} className="p-1 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {cards.map(({ icon: Icon, label, value, color, pct, detail }) => (
          <div key={label}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5" style={{ color }} />
                <span className="text-xs text-white/50">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/30">{detail}</span>
                <span className="text-xs font-bold" style={{ color }}>{value}</span>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(pct * 100, 100)}%` }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="h-full rounded-full"
                style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}80` }}
              />
            </div>
          </div>
        ))}

        {/* HRV */}
        <div className="pt-2 border-t border-white/10">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-white/30">HRV Score</span>
            <span className="text-xs font-bold text-violet-400">{metrics.hrvScore}/100</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-white/30">SpO₂</span>
            <span className="text-xs font-bold text-blue-400">{metrics.oxygenSaturation}%</span>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="w-full py-1.5 rounded-xl text-xs text-white/40 hover:text-white/60 hover:bg-white/5 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </motion.div>
  )
}
