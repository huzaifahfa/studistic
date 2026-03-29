'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Draggable from 'react-draggable'
import { X, Play, Pause, RotateCcw } from 'lucide-react'

const MODES = {
  work:       { label: 'Focus',       duration: 25 * 60, color: '#ef4444' },
  shortBreak: { label: 'Short Break', duration: 5 * 60,  color: '#22c55e' },
  longBreak:  { label: 'Long Break',  duration: 15 * 60, color: '#6366f1' },
}
type ModeKey = keyof typeof MODES

export default function PomodoroTimer({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<ModeKey>('work')
  const [timeLeft, setTimeLeft] = useState(MODES.work.duration)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const nodeRef = useRef<HTMLDivElement>(null)

  const { label, duration, color } = MODES[mode]
  const progress = 1 - timeLeft / duration
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const secs = String(timeLeft % 60).padStart(2, '0')

  useEffect(() => {
    if (!running) return
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setRunning(false)
          setSessions(s => s + 1)
          const next: ModeKey = mode === 'work' ? (sessions % 3 === 2 ? 'longBreak' : 'shortBreak') : 'work'
          setMode(next)
          return MODES[next].duration
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [running, mode, sessions])

  const switchMode = (m: ModeKey) => { setMode(m); setTimeLeft(MODES[m].duration); setRunning(false) }

  const r = 52
  const circumference = 2 * Math.PI * r

  return (
    <Draggable nodeRef={nodeRef as React.RefObject<HTMLElement>} handle=".drag-handle" defaultPosition={{ x: 80, y: 140 }}>
      <div ref={nodeRef} className="absolute">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
          className="glass rounded-2xl border border-white/10 overflow-hidden w-[220px]">
          <div className="drag-handle flex items-center justify-between px-4 py-3 border-b border-white/10 cursor-grab active:cursor-grabbing">
            <span className="text-xs font-semibold text-white/60">Pomodoro</span>
            <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60"><X className="w-3 h-3" /></button>
          </div>

          <div className="p-4">
            {/* Mode tabs */}
            <div className="flex gap-1 mb-4">
              {(Object.keys(MODES) as ModeKey[]).map(m => (
                <button key={m} onClick={() => switchMode(m)}
                  className="flex-1 py-1 rounded-lg text-[10px] font-medium transition-all"
                  style={{ background: mode === m ? `${MODES[m].color}30` : 'transparent', color: mode === m ? MODES[m].color : 'rgba(255,255,255,0.3)' }}>
                  {MODES[m].label}
                </button>
              ))}
            </div>

            {/* Ring */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <svg width="128" height="128" className="-rotate-90">
                  <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                  <circle cx="64" cy="64" r={r} fill="none" stroke={color} strokeWidth="6"
                    strokeLinecap="round" strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - progress)}
                    style={{ transition: 'stroke-dashoffset 1s linear', filter: `drop-shadow(0 0 6px ${color}80)` }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-white tracking-tight">{mins}:{secs}</span>
                  <span className="text-[10px] text-white/40">{label}</span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => { setTimeLeft(duration); setRunning(false) }} className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white/70">
                <RotateCcw className="w-4 h-4" />
              </button>
              <button onClick={() => setRunning(v => !v)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all"
                style={{ background: color, boxShadow: `0 0 16px ${color}60` }}>
                {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <div className="flex gap-1">
                {[0,1,2,3].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: i < sessions % 4 ? color : 'rgba(255,255,255,0.15)' }} />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Draggable>
  )
}
