'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Timer, Coffee, Moon, Droplets, Activity, Sparkles } from 'lucide-react'

const TYPE_ICONS: Record<string, React.ElementType> = {
  pomodoro: Timer,
  break: Coffee,
  sleep: Moon,
  hydration: Droplets,
  stretch: Activity,
}

const TYPE_COLORS: Record<string, string> = {
  pomodoro: '#ef4444',
  break: '#f59e0b',
  sleep: '#6366f1',
  hydration: '#06b6d4',
  stretch: '#22c55e',
}

interface NotificationBannerProps {
  message: string
  type: string
  onDismiss: () => void
  autoDismissMs?: number
}

export default function NotificationBanner({
  message,
  type,
  onDismiss,
  autoDismissMs = 6000,
}: NotificationBannerProps) {
  const Icon = TYPE_ICONS[type] ?? Sparkles
  const color = TYPE_COLORS[type] ?? '#8b5cf6'

  useEffect(() => {
    const t = setTimeout(onDismiss, autoDismissMs)
    return () => clearTimeout(t)
  }, [onDismiss, autoDismissMs])

  return (
    <motion.div
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
    >
      <div
        className="flex items-center gap-3 px-5 py-3 glass rounded-2xl border"
        style={{
          borderColor: `${color}30`,
          boxShadow: `0 8px 30px rgba(0,0,0,0.4), 0 0 0 1px ${color}20`,
          minWidth: 300,
          maxWidth: 480,
        }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}20`, border: `1px solid ${color}30` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <p className="flex-1 text-sm text-white/80 leading-snug">{message}</p>
        <button
          onClick={onDismiss}
          className="p-1 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors flex-shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  )
}
