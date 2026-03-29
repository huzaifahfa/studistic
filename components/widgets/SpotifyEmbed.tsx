'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import Draggable from 'react-draggable'

const DEFAULT_PLAYLIST = 'https://open.spotify.com/embed/playlist/37i9dQZF1DX8NTLI2TtZa6'
const OLIVE = '#6b7c42'

function toEmbedUrl(raw: string): string {
  const url = raw.replace('https://open.spotify.com/', 'https://open.spotify.com/embed/')
  return url.split('?')[0]
}

export default function SpotifyEmbed({ onClose }: { onClose: () => void }) {
  const [embedUrl, setEmbedUrl] = useState(DEFAULT_PLAYLIST)
  const [inputUrl, setInputUrl] = useState('')
  const [showInput, setShowInput] = useState(false)
  const nodeRef = useRef<HTMLDivElement>(null)

  const apply = () => {
    const converted = toEmbedUrl(inputUrl.trim())
    if (converted.includes('spotify.com/embed')) {
      setEmbedUrl(converted)
      setShowInput(false)
      setInputUrl('')
    }
  }

  return (
    <Draggable nodeRef={nodeRef as React.RefObject<HTMLElement>} handle=".drag-handle" defaultPosition={{ x: 820, y: 520 }}>
      <div ref={nodeRef} className="absolute" style={{ zIndex: 20 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          style={{
            width: 290,
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#1db954">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
              <span style={{ color: OLIVE, fontWeight: 800, fontSize: '1.1rem' }}>Spotify</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                onClick={() => setShowInput(v => !v)}
                style={{ color: OLIVE, fontWeight: 700, fontSize: '0.8rem', background: 'none', border: `1px solid ${OLIVE}`, borderRadius: '0.4rem', padding: '0.15rem 0.5rem', cursor: 'pointer' }}
              >
                URL
              </button>
              <button
                onClick={onClose}
                style={{ color: OLIVE, fontWeight: 700, fontSize: '1.1rem', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ···
              </button>
            </div>
          </div>

          {showInput && (
            <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 1rem', borderBottom: `1px solid #f0f0e8` }}>
              <input
                value={inputUrl}
                onChange={e => setInputUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && apply()}
                placeholder="Paste Spotify URL..."
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'var(--font-nunito), sans-serif',
                  fontSize: '0.82rem',
                  color: '#444',
                }}
              />
              <button
                onClick={apply}
                style={{ color: OLIVE, fontWeight: 700, fontSize: '0.82rem', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Go
              </button>
            </div>
          )}

          <iframe
            src={embedUrl}
            width="290"
            height="200"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="block"
          />
        </motion.div>
      </div>
    </Draggable>
  )
}
