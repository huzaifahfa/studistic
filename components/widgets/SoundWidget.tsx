'use client'

import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Draggable from 'react-draggable'

// YouTube API types
declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

const OLIVE = '#6b7c42'

// SVG icons for each ambiance option
function RainIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke={OLIVE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M38 20c0-7.18-5.82-13-13-13s-13 5.82-13 13c-4.42 0-8 3.58-8 8s3.58 8 8 8h26c4.42 0 8-3.58 8-8s-3.58-8-8-8z" />
      <line x1="20" y1="42" x2="18" y2="48" />
      <line x1="28" y1="42" x2="26" y2="48" />
      <line x1="36" y1="42" x2="34" y2="48" />
    </svg>
  )
}

function WaveIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke={OLIVE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 20 C14 12, 20 28, 28 20 S42 12, 48 20" />
      <path d="M6 28 C10 14, 24 38, 34 26 S46 14, 50 26" />
      <path d="M8 38 C14 30, 22 44, 30 36 S44 28, 50 38" />
    </svg>
  )
}

function CafeIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke={OLIVE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="12" y="30" width="12" height="14" rx="2" />
      <rect x="32" y="30" width="12" height="14" rx="2" />
      <circle cx="18" cy="20" r="4" />
      <circle cx="38" cy="20" r="4" />
      <path d="M18 24 v4" />
      <path d="M38 24 v4" />
      <path d="M14 44 h28" />
      <path d="M22 18 q2-4 4-2" />
      <path d="M36 18 q2-4 4-2" />
    </svg>
  )
}

const SOUNDS = [
  { 
    id: 'rain', 
    label: 'Light rain', 
    icon: <RainIcon />, 
    videoId: 'eTeD8DAta4c' // YouTube video ID for rain sounds
  },
  { 
    id: 'wave', 
    label: 'Wave', 
    icon: <WaveIcon />, 
    videoId: 'bn9F19Hi1Lk' // YouTube video ID for wave sounds
  },
  { 
    id: 'cafe', 
    label: 'Cafe Vibe', 
    icon: <CafeIcon />, 
    videoId: 'MYPVQccHhAQ' // YouTube video ID for cafe sounds
  },
] as const

type SoundId = typeof SOUNDS[number]['id']

export default function SoundWidget({ onClose }: { onClose: () => void }) {
  const [active, setActive] = useState<SoundId | null>(null)
  const [player, setPlayer] = useState<any>(null)
  const [ytReady, setYtReady] = useState(false)
  const nodeRef = useRef<HTMLDivElement>(null)

  // Load YouTube IFrame API
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

      window.onYouTubeIframeAPIReady = () => {
        setYtReady(true)
      }
    } else if (window.YT) {
      setYtReady(true)
    }
  }, [])

  const toggle = (id: SoundId) => {
    if (active === id) {
      if (player) {
        player.pauseVideo()
      }
      setActive(null)
    } else {
      setActive(id)
      const sound = SOUNDS.find(s => s.id === id)
      if (sound && ytReady) {
        if (player) {
          // If player exists, load the new video
          player.loadVideoById({
            videoId: sound.videoId,
            startSeconds: 0,
            suggestedQuality: 'small'
          })
          player.setVolume(30) // 30% volume
        } else {
          // Create new player if it doesn't exist
          const newPlayer = new window.YT.Player('youtube-player', {
            height: '0',
            width: '0',
            videoId: sound.videoId,
            playerVars: {
              autoplay: 1,
              loop: 1,
              controls: 0,
              showinfo: 0,
              modestbranding: 1,
              playlist: sound.videoId // Required for looping
            },
            events: {
              onReady: (event: any) => {
                event.target.playVideo()
                event.target.setVolume(30) // 30% volume
              }
            }
          })
          setPlayer(newPlayer)
        }
      }
    }
  }

  useEffect(() => {
    return () => {
      if (player) {
        player.destroy()
      }
    }
  }, [player])

  return (
    <div>
      <Draggable nodeRef={nodeRef as React.RefObject<HTMLElement>} handle=".drag-handle" defaultPosition={{ x: 40, y: 420 }}>
        <div ref={nodeRef} className="absolute" style={{ zIndex: 20 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            style={{
              width: 360,
              borderRadius: '1.25rem',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              backgroundColor: '#f5f0e4',
              fontFamily: 'var(--font-nunito), sans-serif',
            }}
          >
            {/* Header */}
            <div
              className="drag-handle flex items-center justify-between px-5 py-3 cursor-grab active:cursor-grabbing"
              style={{ borderBottom: `2px solid ${OLIVE}` }}
            >
              <span style={{ color: OLIVE, fontWeight: 800, fontSize: '1.3rem' }}>Choose ambiance</span>
              <button
                onClick={onClose}
                style={{ color: OLIVE, fontWeight: 700, fontSize: '1.1rem', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Sound options */}
            <div className="flex justify-around py-6 px-4">
              {SOUNDS.map(s => (
                <button
                  key={s.id}
                  onClick={() => toggle(s.id)}
                  disabled={!ytReady}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.6rem',
                    background: active === s.id ? `${OLIVE}18` : 'none',
                    border: active === s.id ? `2px solid ${OLIVE}` : '2px solid transparent',
                    borderRadius: '1rem',
                    padding: '0.75rem 1.25rem',
                    cursor: ytReady ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s',
                    opacity: ytReady ? 1 : 0.6,
                  }}
                >
                  {s.icon}
                  <span style={{ color: OLIVE, fontWeight: 700, fontSize: '0.85rem' }}>{s.label}</span>
                  {!ytReady && <span style={{ color: '#999', fontSize: '0.7rem' }}>Loading...</span>}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </Draggable>
      {/* Hidden YouTube player */}
      <div id="youtube-player" style={{ position: 'absolute', top: '-1000px', left: '-1000px' }}></div>
    </div>
  )
}
