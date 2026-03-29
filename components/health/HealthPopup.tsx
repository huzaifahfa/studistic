'use client'

import { motion } from 'framer-motion'
import { X, Heart, Wind, Brain, Battery, Activity } from 'lucide-react'
import type { VitalMetrics } from '@/hooks/useRPPG'

export default function HealthPopup({ metrics, onDismiss }: { metrics: VitalMetrics; onDismiss: () => void }) {
  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 20 }}
      className="fixed z-40 glass rounded-2xl border border-white/10 p-5 w-[280px]"
      style={{ top: '50%', right: '240px', transform: 'translateY(-50%)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', cursor: 'grab' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-bold text-white">Health Check</span>
        </div>
        <button onClick={onDismiss} className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/60">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        <Bar label="Heart Rate"  value={`${metrics.heartRate} BPM`} icon={Heart}  pct={metrics.heartRate / 120} color={metrics.heartRate > 90 ? '#f87171' : '#34d399'} />
        <Bar label="Respiration" value={`${metrics.respirationRate} br/min`} icon={Wind}   pct={metrics.respirationRate / 25} color="#34d399" />
        <Bar label="SpO₂"        value={`${metrics.oxygenSaturation}%`}  icon={Heart}  pct={metrics.oxygenSaturation / 100} color="#60a5fa" />
        <Bar label="Stress"      value={`${metrics.stressLevel}%`}        icon={Brain}  pct={metrics.stressLevel / 100} color={metrics.stressLevel > 60 ? '#f87171' : metrics.stressLevel > 35 ? '#fbbf24' : '#34d399'} />
        <Bar label="Fatigue"     value={`${metrics.fatigueLevel}%`}       icon={Battery} pct={metrics.fatigueLevel / 100} color={metrics.fatigueLevel > 60 ? '#f87171' : '#fbbf24'} />
      </div>

      <div className="mt-4 flex items-center gap-2 p-2 rounded-xl bg-white/5">
        <div className={`w-2 h-2 rounded-full ${metrics.stressLevel > 60 || metrics.fatigueLevel > 65 ? 'bg-red-400' : 'bg-green-400'}`} />
        <span className="text-[11px] text-white/50">
          {metrics.stressLevel > 60 ? 'High stress detected' : metrics.fatigueLevel > 65 ? 'Fatigue detected' : 'Vitals look good'}
        </span>
      </div>
    </motion.div>
  )
}

function Bar({ label, value, icon: Icon, pct, color }: { label: string; value: string; icon: React.ElementType; pct: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3 h-3" style={{ color }} />
          <span className="text-[11px] text-white/40">{label}</span>
        </div>
        <span className="text-[11px] font-semibold" style={{ color }}>{value}</span>
      </div>
      <div className="h-1 rounded-full bg-white/10 overflow-hidden">
        <motion.div animate={{ width: `${Math.min(pct * 100, 100)}%` }} transition={{ duration: 0.6 }}
          className="h-full rounded-full" style={{ backgroundColor: color }} />
      </div>
    </div>
  )
}
