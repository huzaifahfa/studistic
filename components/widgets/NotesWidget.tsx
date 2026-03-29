'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Draggable from 'react-draggable'

const OLIVE = '#6b7c42'
const NOTES_KEY = 'studistic_notes'

export default function NotesWidget({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)
  const nodeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(NOTES_KEY)
      if (stored) setText(stored)
    } catch {}
  }, [])

  const handleSave = () => {
    try { localStorage.setItem(NOTES_KEY, text) } catch {}
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <Draggable nodeRef={nodeRef as React.RefObject<HTMLElement>} handle=".drag-handle" defaultPosition={{ x: 40, y: 170 }}>
      <div ref={nodeRef} className="absolute" style={{ zIndex: 20 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          style={{ width: 290, borderRadius: '1.25rem', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', fontFamily: 'var(--font-nunito), sans-serif' }}
        >
          {/* Header — olive green */}
          <div
            className="drag-handle flex items-center justify-between px-4 py-3 cursor-grab active:cursor-grabbing"
            style={{ backgroundColor: OLIVE }}
          >
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.3rem' }}>Notes</span>
            <button
              onClick={onClose}
              style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.05em', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ···
            </button>
          </div>

          {/* Body */}
          <div style={{ backgroundColor: '#fff', padding: '0.75rem 1rem 1rem' }}>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Write your notes here..."
              style={{
                width: '100%',
                minHeight: '160px',
                resize: 'none',
                border: 'none',
                outline: 'none',
                fontFamily: 'var(--font-nunito), sans-serif',
                fontSize: '0.9rem',
                color: '#3a3a2e',
                backgroundColor: 'transparent',
                lineHeight: 1.6,
              }}
            />
            <div className="flex justify-center mt-2">
              <button
                onClick={handleSave}
                style={{
                  backgroundColor: saved ? OLIVE : '#f2eadc',
                  color: saved ? '#fff' : '#2a2a1a',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '0.45rem 1.8rem',
                  fontFamily: 'var(--font-nunito), sans-serif',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {saved ? 'Saved!' : 'Save Note'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </Draggable>
  )
}
