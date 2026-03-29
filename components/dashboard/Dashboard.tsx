'use client'

import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import type { Session } from 'next-auth'
import { signIn, signOut } from 'next-auth/react'
import { Sparkles, Timer, CheckSquare, Music, Image, Camera, CameraOff, CalendarDays, LogOut } from 'lucide-react'
import CameraMonitor from '@/components/camera/CameraMonitor'
import HealthPopup from '@/components/health/HealthPopup'
import AISuggestionModal from '@/components/ai/AISuggestionModal'
import PomodoroTimer from '@/components/widgets/PomodoroTimer'
import TodoList from '@/components/widgets/TodoList'
import SpotifyEmbed from '@/components/widgets/SpotifyEmbed'
import type { VitalMetrics } from '@/hooks/useRPPG'
import type { StudySuggestion } from '@/lib/gemini'

const BACKGROUNDS: Record<string, string> = {
  galaxy:   'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  forest:   'linear-gradient(180deg, #0a2e1a 0%, #134e5e 60%, #71b280 100%)',
  ocean:    'linear-gradient(180deg, #0d1b2a 0%, #1b4965 60%, #5fa8d3 100%)',
  mountains:'linear-gradient(180deg, #1a1a2e 0%, #2c3e50 60%, #4ca1af 100%)',
  night:    'linear-gradient(180deg, #000000 0%, #0f0c29 60%, #1a0533 100%)',
}

export default function Dashboard({ session }: { session: Session | null }) {
  const [bg, setBg] = useState('galaxy')
  const [showBgPicker, setShowBgPicker] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [cameraOn, setCameraOn] = useState(true)
  const [widgets, setWidgets] = useState({ pomodoro: true, todo: true, spotify: false })
  const [todos, setTodos] = useState<string[]>([])
  const [health, setHealth] = useState<VitalMetrics | null>(null)
  const [showHealth, setShowHealth] = useState(false)
  const [suggestion, setSuggestion] = useState<StudySuggestion | null>(null)
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
      setDate(now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const handleMetrics = useCallback(async (m: VitalMetrics) => {
    setHealth(m)
    setShowHealth(true)
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

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: BACKGROUNDS[bg] }}>

      {/* Widgets */}
      <AnimatePresence>
        {widgets.pomodoro && <PomodoroTimer key="pomodoro" onClose={() => toggle('pomodoro')} />}
        {widgets.todo && <TodoList key="todo" onClose={() => toggle('todo')} onTodosChange={setTodos} />}
        {widgets.spotify && <SpotifyEmbed key="spotify" onClose={() => toggle('spotify')} />}
      </AnimatePresence>

      {/* Clock */}
      <div className="absolute top-6 left-6 z-10 pointer-events-none glass rounded-2xl px-5 py-3 border border-white/10">
        <div className="text-3xl font-black text-white tracking-tight">{time}</div>
        <div className="text-xs text-white/40 mt-0.5">{date}</div>
      </div>

      {/* Camera */}
      {cameraOn && (
        <div className="absolute top-6 right-6 z-10">
          <CameraMonitor onMetricsUpdate={handleMetrics} onDisable={() => setCameraOn(false)} />
        </div>
      )}

      {/* Background picker */}
      <AnimatePresence>
        {showBgPicker && (
          <div className="absolute bottom-16 right-6 z-20 glass rounded-2xl border border-white/10 p-4">
            <p className="text-[11px] text-white/40 mb-3 font-medium uppercase tracking-wider">Scene</p>
            <div className="flex gap-2">
              {Object.entries(BACKGROUNDS).map(([key, grad]) => (
                <button key={key} onClick={() => { setBg(key); setShowBgPicker(false) }}
                  className={`w-10 h-10 rounded-xl transition-all ${bg === key ? 'ring-2 ring-white/60 scale-110' : 'hover:scale-105'}`}
                  style={{ background: grad }} title={key} />
              ))}
            </div>
          </div>
        )}
      </AnimatePresence>

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

      {/* Toolbar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-2 border-t border-white/10"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(20px)' }}>

        {/* Logo */}
        <div className="flex items-center gap-2 min-w-[140px]">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow: '0 0 12px rgba(124,58,237,0.4)' }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-white/80">StudySpace</span>
        </div>

        {/* Widget toggles */}
        <div className="flex items-center gap-1">
          <ToolBtn icon={Timer} label="Focus" active={widgets.pomodoro} color="#ef4444" onClick={() => toggle('pomodoro')} />
          <ToolBtn icon={CheckSquare} label="To-Do" active={widgets.todo} color="#22c55e" onClick={() => toggle('todo')} />
          <ToolBtn icon={Music} label="Spotify" active={widgets.spotify} color="#1db954" onClick={() => toggle('spotify')} />
          <div className="w-px h-8 bg-white/10 mx-1" />
          <ToolBtn icon={Image} label="Scene" active={showBgPicker} color="#8b5cf6" onClick={() => setShowBgPicker(v => !v)} />
        </div>

        {/* Right: camera + calendar */}
        <div className="flex items-center gap-2 min-w-[140px] justify-end">
          <button onClick={() => setCameraOn(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              cameraOn ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-white/5 border-white/10 text-white/40'
            }`}>
            {cameraOn ? <Camera className="w-3.5 h-3.5" /> : <CameraOff className="w-3.5 h-3.5" />}
            {cameraOn ? 'Live' : 'Off'}
          </button>

          {session ? (
            <div className="relative">
              <button onClick={() => setShowUserMenu(v => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-green-500/30 bg-green-500/10 text-green-300 text-xs font-medium">
                <CalendarDays className="w-3.5 h-3.5" />
                {session.user?.name?.split(' ')[0]}
              </button>
              {showUserMenu && (
                <div className="absolute bottom-full right-0 mb-2 glass rounded-xl border border-white/10 p-2 min-w-[160px]">
                  <div className="px-3 py-2 border-b border-white/10 mb-1">
                    <p className="text-xs font-semibold text-white/80 truncate">{session.user?.name}</p>
                    <p className="text-[10px] text-white/40 truncate">{session.user?.email}</p>
                  </div>
                  <button onClick={() => signOut({ redirect: false })}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-red-500/10 text-white/50 hover:text-red-400 text-xs">
                    <LogOut className="w-3.5 h-3.5" /> Disconnect calendar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => signIn('google')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-white/10 bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10 transition-all">
              <CalendarDays className="w-3.5 h-3.5" /> Connect Calendar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ToolBtn({ icon: Icon, label, active, color, onClick }: {
  icon: React.ElementType; label: string; active: boolean; color: string; onClick: () => void
}) {
  return (
    <button onClick={onClick}
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all ${
        active ? 'border-transparent' : 'border-transparent hover:bg-white/10'
      }`}
      style={{ background: active ? `${color}20` : undefined }}>
      <Icon className="w-5 h-5" style={{ color: active ? color : 'rgba(255,255,255,0.4)' }} />
      <span className="text-[10px] font-medium" style={{ color: active ? color : 'rgba(255,255,255,0.3)' }}>{label}</span>
    </button>
  )
}
