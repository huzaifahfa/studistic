'use client'

import { useState, useRef, useCallback } from 'react'
import type { Session } from 'next-auth'
import { AnimatePresence } from 'framer-motion'
import BackgroundManager from './BackgroundManager'
import Toolbar from './Toolbar'
import PomodoroTimer from '@/components/widgets/PomodoroTimer'
import TodoList from '@/components/widgets/TodoList'
import SpotifyEmbed from '@/components/widgets/SpotifyEmbed'
import Soundboard from '@/components/widgets/Soundboard'
import CameraMonitor from '@/components/camera/CameraMonitor'
import HealthPopup from '@/components/health/HealthPopup'
import AIsuggestionModal from '@/components/ai/AIsuggestionModal'
import NotificationBanner from '@/components/ai/NotificationBanner'
import type { HealthMetrics } from '@/lib/presage'
import type { StudySuggestion } from '@/lib/gemini'

interface DashboardProps {
  session: Session | null
}

interface WidgetState {
  pomodoro: boolean
  todo: boolean
  spotify: boolean
  soundboard: boolean
}

export default function Dashboard({ session }: DashboardProps) {
  const [widgets, setWidgets] = useState<WidgetState>({
    pomodoro: true,
    todo: true,
    spotify: false,
    soundboard: false,
  })
  const [showBackground, setShowBackground] = useState(false)
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null)
  const [showHealthPopup, setShowHealthPopup] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<StudySuggestion | null>(null)
  const [showAiModal, setShowAiModal] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null)
  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date()
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  })

  // Update clock
  useState(() => {
    const interval = setInterval(() => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
    }, 1000)
    return () => clearInterval(interval)
  })

  const toggleWidget = (key: keyof WidgetState) => {
    setWidgets((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleHealthUpdate = useCallback(async (metrics: HealthMetrics) => {
    setHealthMetrics(metrics)
    setShowHealthPopup(true)

    // Check if we should fetch an AI suggestion
    const shouldSuggest =
      metrics.stressLevel > 60 ||
      metrics.fatigueLevel > 65 ||
      metrics.eyeConcentration < 35

    if (shouldSuggest) {
      try {
        const res = await fetch('/api/gemini/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            healthMetrics: metrics,
            currentTime: new Date().toLocaleTimeString(),
            pomodoroSession: 0,
            todos: [],
          }),
        })
        if (res.ok) {
          const suggestion: StudySuggestion = await res.json()
          setAiSuggestion(suggestion)
          // Delay AI modal so health popup appears first
          setTimeout(() => setShowAiModal(true), 2000)
        }
      } catch {
        // silently fail
      }
    }

    // Late night notification
    const hour = new Date().getHours()
    if (hour >= 23 || hour < 5) {
      setNotification({
        message: "It's late! Consider taking a break and resting for better focus tomorrow.",
        type: 'sleep',
      })
    }
  }, [])

  const user = session?.user ?? undefined

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-zinc-950">
      {/* Background */}
      <BackgroundManager showPanel={showBackground} onClosePanel={() => setShowBackground(false)} />

      {/* Clock overlay (top-left) */}
      <div className="absolute top-6 left-6 z-20 pointer-events-none">
        <div className="glass rounded-2xl px-5 py-3 border border-white/10">
          <div className="text-3xl font-black text-white tracking-tight">{currentTime}</div>
          <div className="text-xs text-white/40 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Camera monitor (top-right) */}
      {cameraEnabled && (
        <div className="absolute top-6 right-6 z-20">
          <CameraMonitor onHealthUpdate={handleHealthUpdate} onDisable={() => setCameraEnabled(false)} />
        </div>
      )}

      {/* Widget layer */}
      <div className="absolute inset-0 z-10">
        <AnimatePresence>
          {widgets.pomodoro && (
            <PomodoroTimer
              key="pomodoro"
              onClose={() => toggleWidget('pomodoro')}
              defaultPosition={{ x: 80, y: 140 }}
            />
          )}
          {widgets.todo && (
            <TodoList
              key="todo"
              onClose={() => toggleWidget('todo')}
              defaultPosition={{ x: 420, y: 140 }}
            />
          )}
          {widgets.spotify && (
            <SpotifyEmbed
              key="spotify"
              onClose={() => toggleWidget('spotify')}
              defaultPosition={{ x: 80, y: 520 }}
            />
          )}
          {widgets.soundboard && (
            <Soundboard
              key="soundboard"
              onClose={() => toggleWidget('soundboard')}
              defaultPosition={{ x: 420, y: 520 }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Toolbar */}
      <Toolbar
        widgets={widgets}
        onToggleWidget={toggleWidget}
        onToggleBackground={() => setShowBackground((v) => !v)}
        onToggleCamera={() => setCameraEnabled((v) => !v)}
        cameraEnabled={cameraEnabled}
        user={user}
      />

      {/* Health popup */}
      <AnimatePresence>
        {showHealthPopup && healthMetrics && (
          <HealthPopup
            metrics={healthMetrics}
            onDismiss={() => setShowHealthPopup(false)}
          />
        )}
      </AnimatePresence>

      {/* AI suggestion modal */}
      <AnimatePresence>
        {showAiModal && aiSuggestion && (
          <AIsuggestionModal
            suggestion={aiSuggestion}
            onDismiss={() => setShowAiModal(false)}
            onAccept={() => {
              setShowAiModal(false)
              setNotification({ message: `Started: ${aiSuggestion.title}`, type: aiSuggestion.type })
            }}
          />
        )}
      </AnimatePresence>

      {/* Notification banner */}
      <AnimatePresence>
        {notification && (
          <NotificationBanner
            message={notification.message}
            type={notification.type}
            onDismiss={() => setNotification(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
