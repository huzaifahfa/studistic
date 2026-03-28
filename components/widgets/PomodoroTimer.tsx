'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, SkipForward, Settings, Sparkles } from 'lucide-react'
import { usePomodoro, type PomodoroMode } from '@/hooks/usePomodoro'
import Widget from './Widget'

interface PomodoroTimerProps {
  onClose?: () => void
  defaultPosition?: { x: number; y: number }
}

const MODE_CONFIG = {
  work: {
    label: 'Focus',
    color: '#ef4444',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    accent: '#ef4444',
  },
  shortBreak: {
    label: 'Short Break',
    color: '#22c55e',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    accent: '#22c55e',
  },
  longBreak: {
    label: 'Long Break',
    color: '#3b82f6',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    accent: '#3b82f6',
  },
}

const CIRCLE_R = 54
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_R

export default function PomodoroTimer({ onClose, defaultPosition }: PomodoroTimerProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [customDurations, setCustomDurations] = useState({ work: 25, shortBreak: 5, longBreak: 15 })

  const {
    mode,
    timeLeft,
    isRunning,
    sessionsCompleted,
    progress,
    formattedTime,
    start,
    pause,
    reset,
    skip,
    switchMode,
    updateDuration,
  } = usePomodoro()

  const config = MODE_CONFIG[mode]
  const dashOffset = CIRCLE_CIRCUMFERENCE * (1 - progress)

  const handleDurationChange = (m: PomodoroMode, val: string) => {
    const minutes = parseInt(val)
    if (!isNaN(minutes) && minutes > 0 && minutes <= 120) {
      setCustomDurations((prev) => ({ ...prev, [m]: minutes }))
      updateDuration(m, minutes)
    }
  }

  return (
    <Widget
      title="Pomodoro Timer"
      onClose={onClose}
      defaultPosition={defaultPosition || { x: 80, y: 140 }}
      minWidth={300}
      accentColor={config.color}
      headerExtra={
        <button
          onClick={(e) => { e.stopPropagation(); setShowSettings((v) => !v) }}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white/70"
        >
          <Settings className="w-3 h-3" />
        </button>
      }
    >
      <div className="w-full" style={{ minWidth: 268 }}>
        {/* Mode tabs */}
        <div className="flex gap-1 mb-4 p-1 rounded-xl bg-white/5 border border-white/10">
          {(Object.keys(MODE_CONFIG) as PomodoroMode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mode === m
                  ? `${MODE_CONFIG[m].bg} ${MODE_CONFIG[m].border} border text-white`
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              {MODE_CONFIG[m].label}
            </button>
          ))}
        </div>

        {/* SVG Ring Timer */}
        <div className="flex flex-col items-center mb-4">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              {/* Background ring */}
              <circle
                cx="60"
                cy="60"
                r={CIRCLE_R}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="6"
              />
              {/* Progress ring */}
              <motion.circle
                cx="60"
                cy="60"
                r={CIRCLE_R}
                fill="none"
                stroke={config.color}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={CIRCLE_CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                style={{
                  filter: `drop-shadow(0 0 6px ${config.color}80)`,
                  transition: 'stroke-dashoffset 0.5s ease',
                }}
              />
            </svg>
            {/* Time display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                key={formattedTime}
                className="text-3xl font-black tracking-tighter text-white"
                style={{ textShadow: `0 0 20px ${config.color}60` }}
              >
                {formattedTime}
              </motion.span>
              <span className="text-xs text-white/40 mt-0.5">{config.label}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <button
            onClick={reset}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-white/50 hover:text-white/80"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={isRunning ? pause : start}
            className="px-8 py-3 rounded-xl font-bold text-white text-sm transition-all"
            style={{
              background: `linear-gradient(135deg, ${config.color}cc, ${config.color}99)`,
              boxShadow: `0 0 20px ${config.color}40`,
            }}
          >
            {isRunning ? (
              <span className="flex items-center gap-2"><Pause className="w-4 h-4" />Pause</span>
            ) : (
              <span className="flex items-center gap-2"><Play className="w-4 h-4" />Start</span>
            )}
          </motion.button>

          <button
            onClick={skip}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-white/50 hover:text-white/80"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Session dots */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-xs text-white/30 mr-2">Sessions</span>
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={i}
              className="rounded-full transition-all"
              style={{
                width: 8,
                height: 8,
                background: i < (sessionsCompleted % 4) ? config.color : 'rgba(255,255,255,0.1)',
                boxShadow: i < (sessionsCompleted % 4) ? `0 0 6px ${config.color}` : 'none',
              }}
              animate={i < (sessionsCompleted % 4) ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.5 }}
            />
          ))}
          <span className="text-xs text-white/30 ml-2">{sessionsCompleted} total</span>
        </div>

        {/* AI Suggestion badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20"
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
          <span className="text-xs text-violet-300 flex-1">AI suggested: 9:00-11:00 AM</span>
          <button className="text-xs text-violet-400 hover:text-violet-300 font-medium px-2 py-0.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 transition-colors">
            Accept
          </button>
        </motion.div>

        {/* Settings panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-white/10 overflow-hidden"
            >
              <p className="text-xs font-semibold text-white/50 mb-3 uppercase tracking-wider">Custom Durations</p>
              <div className="space-y-2">
                {[
                  { key: 'work' as PomodoroMode, label: 'Focus Time' },
                  { key: 'shortBreak' as PomodoroMode, label: 'Short Break' },
                  { key: 'longBreak' as PomodoroMode, label: 'Long Break' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between gap-3">
                    <label className="text-xs text-white/50 flex-1">{label}</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={customDurations[key]}
                        onChange={(e) => handleDurationChange(key, e.target.value)}
                        className="w-14 px-2 py-1 text-xs text-white bg-white/5 border border-white/10 rounded-lg focus:border-violet-500/50 focus:outline-none text-center"
                      />
                      <span className="text-xs text-white/30">min</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Widget>
  )
}
