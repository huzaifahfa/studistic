'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, CheckCircle, CalendarPlus, Timer, Coffee, Moon, Droplets, Dumbbell, Music, Target } from 'lucide-react'
import { signIn, useSession } from 'next-auth/react'
import type { StudySuggestion } from '@/lib/gemini'

const ICONS: Record<string, React.ElementType> = {
  pomodoro: Timer, break: Coffee, sleep: Moon,
  hydration: Droplets, stretch: Dumbbell, music: Music, focus: Target,
}
const COLORS: Record<string, string> = {
  pomodoro: '#ef4444', break: '#f59e0b', sleep: '#6366f1',
  hydration: '#06b6d4', stretch: '#22c55e', music: '#1db954', focus: '#8b5cf6',
}

interface Props {
  suggestion: StudySuggestion
  todos: string[]
  onDismiss: () => void
  onAccept: () => void
}

export default function AISuggestionModal({ suggestion, onDismiss, onAccept }: Props) {
  const { data: session } = useSession()
  const [calendarState, setCalendarState] = useState<'idle' | 'loading' | 'done'>('idle')

  const Icon = ICONS[suggestion.type] ?? Target
  const color = COLORS[suggestion.type] ?? '#8b5cf6'

  const handleCalendar = async () => {
    if (!session) { signIn('google'); return }
    setCalendarState('loading')
    try {
      await fetch('/api/calendar/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: suggestion.title,
          description: suggestion.description,
          startTime: new Date().toISOString(),
          durationMinutes: 25,
        }),
      })
      setCalendarState('done')
    } catch {
      setCalendarState('idle')
    }
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onDismiss} />

      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: 30 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] glass rounded-3xl border border-white/10 overflow-hidden"
        style={{ boxShadow: `0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px ${color}20` }}
      >
        <button onClick={onDismiss} className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-white/10 text-white/30 hover:text-white/60">
          <X className="w-4 h-4" />
        </button>

        <div className="p-7">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 mx-auto"
            style={{ background: `linear-gradient(135deg, ${color}30, ${color}15)`, border: `1px solid ${color}30`, boxShadow: `0 0 30px ${color}20` }}>
            <Icon className="w-8 h-8" style={{ color }} />
          </div>

          {suggestion.urgency === 'high' && (
            <div className="flex items-center justify-center gap-2 mb-3">
              <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1 }}
                className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-xs text-red-300 font-medium">Needs attention</span>
            </div>
          )}

          <h2 className="text-xl font-black text-white text-center mb-2">{suggestion.title}</h2>
          <p className="text-sm text-white/55 text-center leading-relaxed mb-6">{suggestion.description}</p>

          <div className="space-y-2">
            <motion.button whileTap={{ scale: 0.97 }} onClick={onAccept}
              className="w-full py-3 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(135deg, ${color}cc, ${color}99)`, boxShadow: `0 0 20px ${color}30` }}>
              <CheckCircle className="w-4 h-4" />
              {suggestion.actionLabel}
            </motion.button>

            <button onClick={handleCalendar} disabled={calendarState === 'done'}
              className="w-full py-2.5 rounded-2xl text-sm font-medium border border-white/10 hover:border-white/20 flex items-center justify-center gap-2 transition-all hover:bg-white/5 disabled:opacity-60"
              style={{ color: calendarState === 'done' ? '#22c55e' : 'rgba(255,255,255,0.6)' }}>
              {calendarState === 'loading'
                ? <span className="w-3 h-3 border border-white/40 border-t-transparent rounded-full animate-spin" />
                : <CalendarPlus className="w-4 h-4" />}
              {calendarState === 'done' ? 'Added to Calendar!' : session ? 'Add to Google Calendar' : 'Sign in to add to Calendar'}
            </button>

            <button onClick={onDismiss} className="w-full py-2 text-sm text-white/25 hover:text-white/45 transition-colors">
              Not now
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}
