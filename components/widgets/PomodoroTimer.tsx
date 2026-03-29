'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Draggable from 'react-draggable'
import { addStudyMinutes } from '@/lib/studyStats'
import { startStudySession, endStudySession } from '@/lib/db'

const OLIVE = '#6b7c42'
const SALMON = '#c4826e'

const MODES = {
  pomodoro:  { label: 'Pomodoro',     duration: 25 * 60 },
  custom:    { label: 'Custom Timer', duration: 25 * 60 },
  shortBreak:{ label: 'Break',        duration: 5 * 60  },
}
type ModeKey = keyof typeof MODES

export default function PomodoroTimer({ onClose, uid }: { onClose: () => void; uid?: string }) {
  const [mode, setMode] = useState<ModeKey>('pomodoro')
  const [customMinutes, setCustomMinutes] = useState(25)
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [timeLeft, setTimeLeft] = useState(MODES.pomodoro.duration)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const [alarmActive, setAlarmActive] = useState(false)
  const nodeRef = useRef<HTMLDivElement>(null)
  const sessionIdRef = useRef<string | null>(null)

  const duration = mode === 'custom' ? customMinutes * 60 : MODES[mode].duration
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const secs = String(timeLeft % 60).padStart(2, '0')

  const playAlarmSound = () => {
    if (typeof window !== 'undefined' && !alarmActive) {
      setAlarmActive(true)
      const playBeep = () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2)

        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.5)
      }

      // Play initial beep
      playBeep()

      // Set up repeating alarm every 2 seconds
      alarmIntervalRef.current = setInterval(() => {
        playBeep()
      }, 2000)
    }
  }

  const stopAlarm = () => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current)
      alarmIntervalRef.current = null
    }
    setAlarmActive(false)
    setTimeLeft(duration)
    setRunning(false)
  }

  useEffect(() => {
    if (!running) return
    if (mode !== 'shortBreak' && uid && !sessionIdRef.current) {
      startStudySession(uid, mode === 'custom' ? 'free' : 'pomodoro')
        .then(id => { sessionIdRef.current = id })
        .catch(console.error)
    }
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setRunning(false)
          if (mode !== 'shortBreak') {
            const mins = Math.round(duration / 60)
            addStudyMinutes(mins, uid)
            setSessions(s => s + 1)
            if (uid && sessionIdRef.current) {
              endStudySession(uid, sessionIdRef.current, { durationMinutes: mins, tasksCompleted: 0 })
                .catch(console.error)
              sessionIdRef.current = null
            }
          }
          // Start continuous alarm instead of resetting
          playAlarmSound()
          return 0 // Keep at 0 to show timer finished
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [running, mode, duration])

  // Cleanup alarm on unmount
  useEffect(() => {
    return () => {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current)
      }
    }
  }, [])

  const switchMode = (m: ModeKey) => {
    // Stop alarm if active
    if (alarmActive) {
      stopAlarm()
    }
    setMode(m)
    setRunning(false)
    setShowCustomInput(m === 'custom')
    setTimeLeft(m === 'custom' ? customMinutes * 60 : MODES[m].duration)
  }

  const applyCustom = (mins: number) => {
    setCustomMinutes(mins)
    setTimeLeft(mins * 60)
    setShowCustomInput(false)
  }

  return (
    <Draggable nodeRef={nodeRef as React.RefObject<HTMLElement>} handle=".drag-handle" defaultPosition={{ x: 40, y: 580 }}>
      <div ref={nodeRef} className="absolute" style={{ zIndex: 20 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          style={{
            width: 300,
            borderRadius: '1.25rem',
            overflow: 'hidden',
            backgroundColor: '#fff',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            fontFamily: 'var(--font-nunito), sans-serif',
          }}
        >
          {/* Header */}
          <div
            className="drag-handle flex items-center justify-between px-5 py-3 cursor-grab active:cursor-grabbing"
            style={{ borderBottom: `2px solid ${OLIVE}` }}
          >
            <span style={{ color: OLIVE, fontWeight: 800, fontSize: '1.3rem' }}>Timer</span>
            <button
              onClick={onClose}
              style={{ color: OLIVE, fontWeight: 700, fontSize: '1.1rem', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          <div style={{ padding: '1rem 1.25rem 1.25rem' }}>
            {/* Mode tabs */}
            <div className="flex items-center gap-1 mb-4" style={{ fontSize: '0.82rem', fontStyle: 'italic', fontWeight: 600, color: OLIVE }}>
              {(Object.keys(MODES) as ModeKey[]).map((m, i) => (
                <span key={m} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {i > 0 && <span style={{ color: '#aaa', fontStyle: 'normal' }}>|</span>}
                  <button
                    onClick={() => switchMode(m)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-nunito), sans-serif',
                      fontStyle: 'italic',
                      fontWeight: mode === m ? 800 : 600,
                      color: mode === m ? OLIVE : '#aaa',
                      fontSize: '0.82rem',
                      textDecoration: mode === m ? 'underline' : 'none',
                      padding: 0,
                    }}
                  >
                    {MODES[m].label}
                  </button>
                </span>
              ))}
            </div>

            {/* Custom minutes input */}
            {showCustomInput && (
              <div className="flex gap-2 mb-3 items-center">
                <input
                  type="number"
                  defaultValue={customMinutes}
                  min={1}
                  max={180}
                  style={{
                    flex: 1,
                    border: `1.5px solid ${OLIVE}`,
                    borderRadius: '0.5rem',
                    padding: '0.35rem 0.6rem',
                    fontFamily: 'var(--font-nunito), sans-serif',
                    fontWeight: 700,
                    color: OLIVE,
                    outline: 'none',
                    fontSize: '0.9rem',
                  }}
                  onKeyDown={e => { if (e.key === 'Enter') applyCustom(Number((e.target as HTMLInputElement).value)) }}
                  onChange={e => {
                    const v = Number(e.target.value)
                    if (v > 0 && v <= 180) applyCustom(v)
                  }}
                />
                <span style={{ color: '#888', fontSize: '0.82rem' }}>min</span>
              </div>
            )}

            {/* Timer display */}
            <div className="flex justify-center my-4">
              <span
                style={{
                  fontSize: '3.5rem',
                  fontWeight: 900,
                  color: alarmActive ? '#ff4444' : OLIVE,
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  textShadow: alarmActive ? '0 0 10px rgba(255,68,68,0.5)' : 'none',
                }}
              >
                {alarmActive ? '00:00' : `${mins}:${secs}`}
              </span>
            </div>

            {/* Alarm message and OK button */}
            {alarmActive && (
              <div className="text-center mb-4">
                <p style={{ color: '#ff4444', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                  Time's up! 🎉
                </p>
                <button
                  onClick={stopAlarm}
                  style={{
                    backgroundColor: '#ff4444',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '0.5rem 1.5rem',
                    color: '#fff',
                    fontFamily: 'var(--font-nunito), sans-serif',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(255,68,68,0.3)',
                  }}
                >
                  OK
                </button>
              </div>
            )}

            {/* Session dots */}
            <div className="flex justify-center gap-1.5 mb-4">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: i < sessions % 4 ? OLIVE : '#e0e0d0',
                  }}
                />
              ))}
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  if (alarmActive) {
                    stopAlarm()
                  } else {
                    setTimeLeft(duration)
                    setRunning(false)
                  }
                }}
                style={{
                  background: 'none',
                  border: `1.5px solid ${OLIVE}`,
                  borderRadius: '9999px',
                  padding: '0.4rem 1.2rem',
                  color: OLIVE,
                  fontFamily: 'var(--font-nunito), sans-serif',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                {alarmActive ? 'Stop' : 'Reset'}
              </button>
              <button
                onClick={() => setRunning(v => !v)}
                disabled={alarmActive}
                style={{
                  backgroundColor: alarmActive ? '#ccc' : OLIVE,
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '0.4rem 1.8rem',
                  color: '#fff',
                  fontFamily: 'var(--font-nunito), sans-serif',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: alarmActive ? 'not-allowed' : 'pointer',
                  boxShadow: alarmActive ? 'none' : `0 4px 12px ${OLIVE}55`,
                }}
              >
                {running ? 'Pause' : 'Start'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </Draggable>
  )
}
