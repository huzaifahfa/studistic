'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import type { Session } from 'next-auth'
import { signIn, signOut, useSession } from 'next-auth/react'
import {
  Home, Clock, Calendar, Volume2, ClipboardList, BookOpen,
  Monitor, CalendarDays, LogOut, User, Activity, Sparkles,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import CameraMonitor from '@/components/camera/CameraMonitor'
import HealthPopup from '@/components/health/HealthPopup'
import AISuggestionModal from '@/components/ai/AIsuggestionModal'
import PomodoroTimer from '@/components/widgets/PomodoroTimer'
import TodoList from '@/components/widgets/TodoList'
import SpotifyEmbed from '@/components/widgets/SpotifyEmbed'
import NotesWidget from '@/components/widgets/NotesWidget'
import SoundWidget from '@/components/widgets/SoundWidget'
import StudyPlanWidget from '@/components/widgets/StudyPlanWidget'
import BackgroundVideo from './BackgroundVideo'
import type { VitalMetrics } from '@/hooks/useRPPG'
import type { StudySuggestion, StudyPlan, StudyPlanItem } from '@/lib/gemini'
import { upsertUser, saveBiometricReading } from '@/lib/db'
import { syncFromFirestore } from '@/lib/studyStats'

const OLIVE = '#6b7c42'
const SALMON = '#c4826e'

const BACKGROUNDS: Record<string, { type: 'image' | 'gradient' | 'video'; value: string; thumb: string }> = {
  forest: {
    type: 'video',
    value: 'https://videos.pexels.com/video-files/32537366/13875518_2560_1440_30fps.mp4',
    thumb: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=60',
  },
  lake: {
    type: 'video',
    value: 'https://videos.pexels.com/video-files/7154839/7154839-uhd_2560_1440_25fps.mp4',
    thumb: 'https://images.pexels.com/photos/34732508/pexels-photo-34732508.jpeg',
  },
  ocean: {
    type: 'video',
    value: 'https://videos.pexels.com/video-files/7010435/7010435-uhd_2732_1440_30fps.mp4', // Example video URL
    thumb: 'https://images.pexels.com/photos/11828630/pexels-photo-11828630.jpeg',
  },
  city: {
    type: 'video',
    value: 'https://videos.pexels.com/video-files/30598738/13101700_2560_1440_60fps.mp4',
    thumb: 'https://images.pexels.com/photos/35889296/pexels-photo-35889296.jpeg',
  },
  cafe: {
    type: 'video',
    value: 'https://videos.pexels.com/video-files/34784544/14747418_2560_1440_30fps.mp4',
    thumb: 'https://images.pexels.com/photos/34604858/pexels-photo-34604858.jpeg',
  },
  rain: {
    type: 'video',
    value: 'https://www.w3schools.com/howto/rain.mp4', // Rain video from w3schools
    thumb: 'https://images.pexels.com/photos/25961352/pexels-photo-25961352.jpeg',
  },
}

export default function Dashboard({ session }: { session: Session | null }) {
  const router = useRouter()
  const { data: liveSession } = useSession()
  const [bg, setBg] = useState('forest')
  const [showBgPicker, setShowBgPicker] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [cameraOn, setCameraOn] = useState(true)
  const [widgets, setWidgets] = useState({
    pomodoro: false,
    todo: false,
    spotify: false,
    notes: false,
    sound: false,
    studyPlan: false,
  })
  const [todos, setTodos] = useState<string[]>([])
  const [health, setHealth] = useState<VitalMetrics | null>(null)
  const [showHealth, setShowHealth] = useState(false)
  const [suggestion, setSuggestion] = useState<StudySuggestion | null>(null)
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [videoPaused] = useState(false)
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null)
  const [studyPlanLoading, setStudyPlanLoading] = useState(false)
  const [pomodoroPreset, setPomodoroPreset] = useState<number | undefined>(undefined)
  const videoRef = useRef<HTMLVideoElement>(null)
  const lastBiometricSave = useRef(0)

  const bgData = BACKGROUNDS[bg]
  const bgStyle =
    bgData.type === 'image'
      ? { backgroundImage: `url(${bgData.value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : bgData.type === 'video'
      ? {} // Videos will be handled separately
      : { background: bgData.value }

  const handleMetrics = useCallback(async (m: VitalMetrics) => {
    setHealth(m)
    const uid = session?.user?.id
    const now = Date.now()
    if (uid && now - lastBiometricSave.current > 30_000) {
      lastBiometricSave.current = now
      saveBiometricReading(uid, {
        heartRate: m.heartRate,
        respirationRate: m.respirationRate,
        oxygenSaturation: m.oxygenSaturation,
        stressLevel: m.stressLevel,
        fatigueLevel: m.fatigueLevel,
        hrvScore: m.hrvScore,
      }).catch(console.error)
    }
    if (m.stressLevel > 60 || m.fatigueLevel > 65) {
      try {
        const res = await fetch('/api/gemini/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metrics: m, todos }),
        })
        if (res.ok) {
          const s: StudySuggestion = await res.json()
          setSuggestion(s)
          setTimeout(() => setShowSuggestion(true), 1500)
        }
      } catch { /* silently fail */ }
    }
  }, [todos])

  const toggle = (k: keyof typeof widgets) => setWidgets(v => ({ ...v, [k]: !v[k] }))

  const openStudyPlan = async () => {
    setWidgets(v => ({ ...v, studyPlan: true }))
    if (studyPlan) return // already loaded
    setStudyPlanLoading(true)
    try {
      const res = await fetch('/api/gemini/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics: health, todos }),
      })
      if (res.ok) setStudyPlan(await res.json())
    } catch { /* silently fail */ }
    setStudyPlanLoading(false)
  }

  const handleStudyPlanAccept = async (item: StudyPlanItem) => {
    if (item.type === 'pomodoro' && item.pomodoroMinutes) {
      setPomodoroPreset(item.pomodoroMinutes)
      setWidgets(v => ({ ...v, pomodoro: true }))
    } else if (item.type === 'calendar' && item.calendarEvent) {
      const accessToken = liveSession?.accessToken ?? session?.accessToken
      if (!accessToken) {
        signIn('google')
        return
      }
      const res = await fetch('/api/calendar/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title,
          description: item.description,
          startTime: item.calendarEvent.startTime,
          durationMinutes: item.calendarEvent.durationMinutes,
          accessToken,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('[calendar/add]', err)
      }
    }
    // tips just get acknowledged
  }

  // Handle background changes
  const handleBgChange = (newBg: string) => {
    setBg(newBg)
    setShowBgPicker(false)
    
    if (BACKGROUNDS[newBg].type !== 'video' && videoRef.current) {
      videoRef.current.pause()
    }
  }

  // Effect to handle video playback when background changes
  useEffect(() => {
    if (bgData.type === 'video' && videoRef.current) {
      videoRef.current.play().catch(() => {/* autoplay blocked */})
    }
  }, [bg, bgData.type])
  // Upsert user profile + sync stats when session is established
  useEffect(() => {
    const uid = session?.user?.id
    const email = session?.user?.email
    const name = session?.user?.name
    if (!uid || !email) return
    upsertUser(uid, { email, name: name ?? '', photoURL: session?.user?.image ?? undefined })
      .catch(console.error)
    syncFromFirestore(uid).catch(console.error)
  }, [session?.user?.id])

  // Close panels when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (!t.closest('[data-bg-picker]')) setShowBgPicker(false)
      if (!t.closest('[data-user-menu]')) setShowUserMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={bgData.type !== 'video' ? bgStyle : {}}>
      {/* Background video for video types */}
      {bgData.type === 'video' && (
        <video
          ref={videoRef}
          key={bg} // Force re-render when background changes
          autoPlay={!videoPaused}
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 1,
          }}
        >
          <source src={bgData.value} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}

      {/* Subtle dark overlay for contrast */}
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.08)', pointerEvents: 'none', zIndex: 2 }} />

      {/* Floating widgets */}
      <AnimatePresence>
        {widgets.pomodoro && <PomodoroTimer key="pomodoro" onClose={() => { toggle('pomodoro'); setPomodoroPreset(undefined) }} uid={session?.user?.id} presetMinutes={pomodoroPreset} />}
        {widgets.todo && <TodoList key="todo" onClose={() => toggle('todo')} onTodosChange={setTodos} uid={session?.user?.id} />}
        {widgets.spotify && <SpotifyEmbed key="spotify" onClose={() => toggle('spotify')} />}
        {widgets.notes && <NotesWidget key="notes" onClose={() => toggle('notes')} />}
        {widgets.sound && <SoundWidget key="sound" onClose={() => toggle('sound')} />}
        {widgets.studyPlan && (
          <StudyPlanWidget
            key="studyPlan"
            onClose={() => toggle('studyPlan')}
            plan={studyPlan}
            loading={studyPlanLoading}
            onAccept={handleStudyPlanAccept}
          />
        )}
      </AnimatePresence>

      {/* Background picker panel */}
      <AnimatePresence>
        {showBgPicker && (
          <div
            data-bg-picker
            style={{
              position: 'absolute',
              top: '90px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 30,
              backgroundColor: '#fff',
              borderRadius: '1.25rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              padding: '0',
              overflow: 'hidden',
              width: 460,
              fontFamily: 'var(--font-nunito), sans-serif',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1.25rem',
                borderBottom: `2px solid ${SALMON}`,
              }}
            >
              <span style={{ color: SALMON, fontWeight: 800, fontSize: '1.2rem' }}>Choose background</span>
              <button
                onClick={() => setShowBgPicker(false)}
                style={{ color: SALMON, fontWeight: 700, fontSize: '1.1rem', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '1rem' }}>
              {Object.entries(BACKGROUNDS).map(([key, data]) => (
                <button
                  key={key}
                  onClick={() => handleBgChange(key)}
                  style={{
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    border: bg === key ? `3px solid ${OLIVE}` : '3px solid transparent',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'border-color 0.15s',
                    position: 'relative',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.thumb}
                    alt={key}
                    style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }}
                  />
                  {data.type === 'video' && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="#fff"><polygon points="2,1 9,5 2,9"/></svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Top toolbar — pill */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 40,
          backgroundColor: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '9999px',
          padding: '0.5rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          fontFamily: 'var(--font-nunito), sans-serif',
        }}
      >
        <ToolBtn icon={Home} label="Home" active={false} onClick={() => router.push('/')} />
        <ToolBtn icon={Clock} label="Timer" active={widgets.pomodoro} onClick={() => toggle('pomodoro')} />
        <ToolBtn icon={Calendar} label="Calendar" active={false} onClick={() => window.open('https://calendar.google.com', '_blank')} />
        <ToolBtn icon={Activity} label="Health" active={showHealth} onClick={() => health && setShowHealth(v => !v)} />
        <ToolBtn icon={Volume2} label="Sound" active={widgets.sound} onClick={() => toggle('sound')} />
        <ToolBtn icon={ClipboardList} label="Tasks" active={widgets.todo} onClick={() => toggle('todo')} />
        <ToolBtn icon={BookOpen} label="Notes" active={widgets.notes} onClick={() => toggle('notes')} />
        <ToolBtn
          icon={Monitor}
          label="Background"
          active={showBgPicker}
          onClick={() => setShowBgPicker(v => !v)}
          dataBgPicker
        />
        <ToolBtn
          icon={() => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
          )}
          label="Spotify"
          active={widgets.spotify}
          onClick={() => toggle('spotify')}
        />
        <ToolBtn icon={Sparkles} label="Study" active={widgets.studyPlan} onClick={openStudyPlan} />
      </div>

      {/* Top-right: camera + user menu */}
      <div style={{ position: 'absolute', top: 20, right: 24, zIndex: 40, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Camera toggle */}
        <button
          onClick={() => setCameraOn(v => !v)}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: cameraOn ? 'rgba(107,124,66,0.15)' : 'rgba(255,255,255,0.7)',
            border: `2px solid ${cameraOn ? OLIVE : '#ccc'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cameraOn ? OLIVE : '#999'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 7l-7 5 7 5V7z" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        </button>

        {/* User menu */}
        <div style={{ position: 'relative' }} data-user-menu>
          <button
            onClick={() => setShowUserMenu(v => !v)}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: session ? `${OLIVE}22` : 'rgba(255,255,255,0.7)',
              border: `2px solid ${session ? OLIVE : '#ccc'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              overflow: 'hidden',
            }}
          >
            <User style={{ color: session ? OLIVE : '#999', width: 20, height: 20 }} strokeWidth={1.8} />
          </button>

          {showUserMenu && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                backgroundColor: '#fff',
                borderRadius: '1rem',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                padding: '0.5rem',
                minWidth: 190,
                fontFamily: 'var(--font-nunito), sans-serif',
                zIndex: 50,
              }}
            >
              {session ? (
                <>
                  <div style={{ padding: '0.5rem 0.75rem 0.6rem', borderBottom: '1px solid #f0f0ea', marginBottom: '0.25rem' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#333', margin: 0 }}>{session.user?.name}</p>
                    <p style={{ fontSize: '0.75rem', color: '#999', margin: 0 }}>{session.user?.email}</p>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.45rem 0.75rem',
                      borderRadius: '0.6rem',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      color: SALMON,
                      fontFamily: 'var(--font-nunito), sans-serif',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                    }}
                  >
                    <LogOut style={{ width: 14, height: 14 }} /> Sign out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => signIn('google')}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.6rem',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: OLIVE,
                    fontFamily: 'var(--font-nunito), sans-serif',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                  }}
                >
                  <CalendarDays style={{ width: 16, height: 16 }} /> Connect Calendar
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Camera monitor */}
      {cameraOn && (
        <div style={{ position: 'absolute', bottom: 24, right: 24, zIndex: 30 }}>
          <CameraMonitor onMetricsUpdate={handleMetrics} onDisable={() => setCameraOn(false)} />
        </div>
      )}

      {/* Health popup */}
      <AnimatePresence>
        {showHealth && health && (
          <HealthPopup key="health" metrics={health} onDismiss={() => setShowHealth(false)} />
        )}
      </AnimatePresence>

      {/* AI suggestion */}
      <AnimatePresence>
        {showSuggestion && suggestion && (
          <AISuggestionModal
            key="ai"
            suggestion={suggestion}
            todos={todos}
            onDismiss={() => setShowSuggestion(false)}
            onAccept={() => setShowSuggestion(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function ToolBtn({
  icon: Icon,
  label,
  active,
  onClick,
  dataBgPicker,
}: {
  icon: React.ElementType
  label: string
  active: boolean
  onClick: () => void
  dataBgPicker?: boolean
}) {
  return (
    <button
      onClick={onClick}
      {...(dataBgPicker ? { 'data-bg-picker': '' } : {})}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.2rem',
        padding: '0.45rem 0.75rem',
        borderRadius: '9999px',
        border: 'none',
        cursor: 'pointer',
        backgroundColor: active ? `${OLIVE}18` : 'transparent',
        transition: 'background-color 0.15s',
        fontFamily: 'var(--font-nunito), sans-serif',
      }}
    >
      <Icon
        style={{
          width: 22,
          height: 22,
          color: active ? OLIVE : '#2a2a2a',
          strokeWidth: 1.8,
        }}
      />
      <span
        style={{
          fontSize: '0.62rem',
          fontWeight: 700,
          color: active ? OLIVE : '#555',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </button>
  )
}
