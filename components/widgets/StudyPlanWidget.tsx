'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Draggable from 'react-draggable'
import type { StudyPlan, StudyPlanItem } from '@/lib/gemini'

const OLIVE = '#6b7c42'
const SALMON = '#c4826e'
const CREAM = '#f5f0e4'

const CATEGORY_LABEL: Record<string, string> = {
  study: 'Study',
  mental_health: 'Mental Health',
  time_management: 'Time Management',
}

const TYPE_COLOR: Record<string, string> = {
  calendar: OLIVE,
  pomodoro: SALMON,
  tip: '#8b7355',
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

interface Props {
  onClose: () => void
  plan: StudyPlan | null
  loading: boolean
  onAccept: (item: StudyPlanItem) => Promise<void>
  onGenerate: (windowStart: string, windowEnd: string) => void
}

function toLocalTimeInput(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function timeInputToISO(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

export default function StudyPlanWidget({ onClose, plan, loading, onAccept, onGenerate }: Props) {
  const nodeRef = useRef<HTMLDivElement>(null)
  const [itemStates, setItemStates] = useState<Record<string, 'idle' | 'loading' | 'accepted' | 'denied'>>({})

  // Default: from now (rounded to next 30 min) to 23:00
  const defaultStart = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() < 30 ? 30 : 60, 0, 0)
    return toLocalTimeInput(now)
  }
  const [winFrom, setWinFrom] = useState(defaultStart)
  const [winTo, setWinTo] = useState('23:00')

  const handleAccept = async (item: StudyPlanItem) => {
    setItemStates(s => ({ ...s, [item.id]: 'loading' }))
    await onAccept(item)
    setItemStates(s => ({ ...s, [item.id]: 'accepted' }))
  }

  const handleDeny = (id: string) => {
    setItemStates(s => ({ ...s, [id]: 'denied' }))
  }

  return (
    <Draggable nodeRef={nodeRef as React.RefObject<HTMLElement>} handle=".drag-handle" defaultPosition={{ x: 300, y: 80 }}>
      <div ref={nodeRef} className="absolute" style={{ zIndex: 25 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          style={{
            width: 360,
            maxHeight: 560,
            borderRadius: '1.25rem',
            overflow: 'hidden',
            backgroundColor: '#fff',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            fontFamily: 'var(--font-nunito), sans-serif',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            className="drag-handle flex items-center justify-between px-5 py-3 cursor-grab active:cursor-grabbing"
            style={{ borderBottom: `2px solid ${OLIVE}`, flexShrink: 0 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>✦</span>
              <span style={{ color: OLIVE, fontWeight: 800, fontSize: '1.2rem' }}>Study Plan</span>
            </div>
            <button
              onClick={onClose}
              style={{ color: OLIVE, fontWeight: 700, fontSize: '1.1rem', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1rem', gap: '0.75rem' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  border: `3px solid ${OLIVE}`,
                  borderTopColor: 'transparent',
                  animation: 'spin 0.8s linear infinite',
                }} />
                <p style={{ color: '#999', fontSize: '0.85rem', fontWeight: 600 }}>Checking your calendar...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {!loading && !plan && (
              <div style={{ padding: '1.25rem' }}>
                <p style={{ fontSize: '0.8rem', color: '#888', fontWeight: 600, marginBottom: '0.85rem', textAlign: 'center' }}>
                  When do you want to work today?
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.68rem', fontWeight: 800, color: OLIVE, display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>From</label>
                    <input
                      type="time"
                      value={winFrom}
                      min="07:00"
                      max="23:00"
                      onChange={e => setWinFrom(e.target.value)}
                      style={{
                        width: '100%', padding: '0.45rem 0.6rem',
                        border: `1.5px solid ${OLIVE}`, borderRadius: '0.6rem',
                        fontSize: '0.85rem', fontFamily: 'var(--font-nunito), sans-serif',
                        color: '#333', outline: 'none',
                      }}
                    />
                  </div>
                  <span style={{ marginTop: '1.1rem', color: '#bbb', fontWeight: 700 }}>→</span>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.68rem', fontWeight: 800, color: OLIVE, display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>To</label>
                    <input
                      type="time"
                      value={winTo}
                      min="07:00"
                      max="23:00"
                      onChange={e => setWinTo(e.target.value)}
                      style={{
                        width: '100%', padding: '0.45rem 0.6rem',
                        border: `1.5px solid ${OLIVE}`, borderRadius: '0.6rem',
                        fontSize: '0.85rem', fontFamily: 'var(--font-nunito), sans-serif',
                        color: '#333', outline: 'none',
                      }}
                    />
                  </div>
                </div>
                <p style={{ fontSize: '0.7rem', color: '#bbb', textAlign: 'center', marginBottom: '1rem' }}>
                  Schedules only between 7 AM – 11 PM · Avoids your existing events
                </p>
                <button
                  onClick={() => onGenerate(timeInputToISO(winFrom), timeInputToISO(winTo))}
                  style={{
                    width: '100%', padding: '0.6rem',
                    backgroundColor: OLIVE, color: '#fff',
                    border: 'none', borderRadius: '0.75rem',
                    fontWeight: 800, fontSize: '0.9rem',
                    cursor: 'pointer', fontFamily: 'var(--font-nunito), sans-serif',
                  }}
                >
                  Generate Plan
                </button>
              </div>
            )}

            {!loading && plan && (
              <>
                {/* Summary */}
                <div style={{ backgroundColor: CREAM, padding: '0.75rem 1.25rem', borderBottom: '1px solid #ede8dc' }}>
                  <p style={{ fontSize: '0.82rem', color: '#6b5e45', fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
                    {plan.summary}
                  </p>
                </div>

                {/* Items */}
                <AnimatePresence>
                  {plan.items.map((item) => {
                    const state = itemStates[item.id] ?? 'idle'
                    if (state === 'denied') return null
                    const color = TYPE_COLOR[item.type] ?? OLIVE

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        style={{ borderBottom: '1px solid #f5ede4', padding: '0.85rem 1.25rem' }}
                      >
                        {/* Type badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                          <span style={{
                            fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                            color: '#fff', backgroundColor: color,
                            padding: '0.1rem 0.45rem', borderRadius: '9999px',
                          }}>
                            {item.type === 'tip' && item.category
                              ? CATEGORY_LABEL[item.category] ?? 'Tip'
                              : item.type === 'pomodoro' ? 'Timer' : 'Calendar'}
                          </span>
                          {item.type === 'pomodoro' && item.pomodoroMinutes && (
                            <span style={{ fontSize: '0.72rem', color: SALMON, fontWeight: 700 }}>{item.pomodoroMinutes} min</span>
                          )}
                        </div>

                        <p style={{ fontSize: '0.88rem', fontWeight: 800, color: '#333', margin: '0 0 0.25rem' }}>{item.title}</p>
                        <p style={{ fontSize: '0.78rem', color: '#888', margin: '0 0 0.5rem', lineHeight: 1.45 }}>{item.description}</p>

                        {item.type === 'calendar' && item.calendarEvent && (
                          <p style={{ fontSize: '0.72rem', color: OLIVE, fontWeight: 700, margin: '0 0 0.5rem' }}>
                            {formatDate(item.calendarEvent.startTime)} · {item.calendarEvent.durationMinutes} min
                          </p>
                        )}

                        {/* Accept / Deny */}
                        {state === 'accepted' ? (
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: OLIVE }}>✓ Applied</span>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleAccept(item)}
                              disabled={state === 'loading'}
                              style={{
                                fontSize: '0.75rem', fontWeight: 700,
                                backgroundColor: OLIVE, color: '#fff',
                                border: 'none', borderRadius: '9999px',
                                padding: '0.3rem 0.9rem', cursor: 'pointer',
                                opacity: state === 'loading' ? 0.6 : 1,
                              }}
                            >
                              {state === 'loading' ? '...' : 'Accept'}
                            </button>
                            <button
                              onClick={() => handleDeny(item.id)}
                              style={{
                                fontSize: '0.75rem', fontWeight: 700,
                                backgroundColor: 'transparent', color: '#bbb',
                                border: '1px solid #ddd', borderRadius: '9999px',
                                padding: '0.3rem 0.9rem', cursor: 'pointer',
                              }}
                            >
                              Deny
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </Draggable>
  )
}
