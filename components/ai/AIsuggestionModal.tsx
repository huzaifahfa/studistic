'use client'

import { motion } from 'framer-motion'
import {
  Timer, Coffee, Moon, Droplets, Activity, Music, Target,
  Calendar, CheckCircle, X
} from 'lucide-react'
import { signIn, useSession } from 'next-auth/react'
import type { StudySuggestion } from '@/lib/gemini'

const TYPE_ICONS: Record<string, React.ElementType> = {
  pomodoro: Timer,
  break: Coffee,
  sleep: Moon,
  hydration: Droplets,
  stretch: Activity,
  music: Music,
  focus: Target,
}

const TYPE_COLORS: Record<string, string> = {
  pomodoro: '#ef4444',
  break: '#f59e0b',
  sleep: '#6366f1',
  hydration: '#06b6d4',
  stretch: '#22c55e',
  music: '#1db954',
  focus: '#8b5cf6',
}

const URGENCY_STYLES = {
  high: 'border-red-500/30 bg-red-500/5',
  medium: 'border-amber-500/30 bg-amber-500/5',
  low: 'border-white/10 bg-white/5',
}

interface AIsuggestionModalProps {
  suggestion: StudySuggestion
  onDismiss: () => void
  onAccept: () => void
}

export default function AIsuggestionModal({ suggestion, onDismiss, onAccept }: AIsuggestionModalProps) {
  const Icon = TYPE_ICONS[suggestion.type] ?? Target
  const color = TYPE_COLORS[suggestion.type] ?? '#8b5cf6'
  const isLateNight = new Date().getHours() >= 22 || new Date().getHours() < 6
  const { data: session } = useSession()

  const handleAddCalendar = async () => {
    if (!suggestion.calendarEvent) return
    if (!session) {
      signIn('google')
      return
    }
    try {
      await fetch('/api/calendar/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(suggestion.calendarEvent),
      })
    } catch {
      // silently fail
    }
    onAccept()
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onDismiss}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: 30 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        className={`fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] glass rounded-3xl border overflow-hidden ${URGENCY_STYLES[suggestion.urgency]}`}
        style={{ boxShadow: `0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px ${color}20` }}
      >
        {/* Close */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 mx-auto"
            style={{
              background: `linear-gradient(135deg, ${color}30, ${color}15)`,
              border: `1px solid ${color}30`,
              boxShadow: `0 0 30px ${color}20`,
            }}
          >
            <Icon className="w-8 h-8" style={{ color }} />
          </motion.div>

          {/* Late night badge */}
          {isLateNight && (
            <div className="flex justify-center mb-3">
              <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center gap-1">
                <Moon className="w-3 h-3" />
                Late night mode
              </span>
            </div>
          )}

          {/* Content */}
          <h2 className="text-xl font-black text-white text-center mb-2">{suggestion.title}</h2>
          <p className="text-sm text-white/60 text-center leading-relaxed mb-6">{suggestion.description}</p>

          {/* Urgency indicator */}
          {suggestion.urgency === 'high' && (
            <div className="flex items-center justify-center gap-2 mb-4 p-2 rounded-xl bg-red-500/10 border border-red-500/20">
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-2 h-2 rounded-full bg-red-400"
              />
              <span className="text-xs text-red-300">Needs attention</span>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            {suggestion.action && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onAccept}
                className="w-full py-3 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all"
                style={{
                  background: `linear-gradient(135deg, ${color}cc, ${color}99)`,
                  boxShadow: `0 0 20px ${color}30`,
                }}
              >
                <CheckCircle className="w-4 h-4" />
                {suggestion.action.label}
              </motion.button>
            )}

            {suggestion.calendarEvent && (
              <button
                onClick={handleAddCalendar}
                className="w-full py-2.5 rounded-2xl text-sm font-medium text-white/70 hover:text-white border border-white/10 hover:border-white/20 flex items-center justify-center gap-2 transition-all hover:bg-white/5"
              >
                <Calendar className="w-4 h-4" />
                Add to Google Calendar
              </button>
            )}

            <button
              onClick={onDismiss}
              className="w-full py-2 rounded-xl text-sm text-white/30 hover:text-white/50 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}
