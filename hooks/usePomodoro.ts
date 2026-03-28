'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export type PomodoroMode = 'work' | 'shortBreak' | 'longBreak'

export interface PomodoroState {
  mode: PomodoroMode
  timeLeft: number
  isRunning: boolean
  sessionsCompleted: number
  totalSeconds: number
}

interface UsePomodoroOptions {
  workDuration?: number      // minutes
  shortBreakDuration?: number
  longBreakDuration?: number
  longBreakInterval?: number // sessions before long break
  onComplete?: (mode: PomodoroMode) => void
}

const DEFAULT_DURATIONS: Record<PomodoroMode, number> = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
}

export function usePomodoro(options: UsePomodoroOptions = {}) {
  const {
    workDuration = DEFAULT_DURATIONS.work,
    shortBreakDuration = DEFAULT_DURATIONS.shortBreak,
    longBreakDuration = DEFAULT_DURATIONS.longBreak,
    longBreakInterval = 4,
    onComplete,
  } = options

  const [durations, setDurations] = useState({
    work: workDuration,
    shortBreak: shortBreakDuration,
    longBreak: longBreakDuration,
  })

  const [mode, setMode] = useState<PomodoroMode>('work')
  const [timeLeft, setTimeLeft] = useState(durations.work)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionsCompleted, setSessionsCompleted] = useState(0)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const totalSeconds = durations[mode]
  const progress = 1 - timeLeft / totalSeconds

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const playBeep = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 440
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.8)
    } catch {
      // Audio not available
    }
  }, [])

  const handleComplete = useCallback(() => {
    clearTimer()
    setIsRunning(false)
    playBeep()
    onCompleteRef.current?.(mode)

    if (mode === 'work') {
      const newSessions = sessionsCompleted + 1
      setSessionsCompleted(newSessions)
      if (newSessions % longBreakInterval === 0) {
        setMode('longBreak')
        setTimeLeft(durations.longBreak)
      } else {
        setMode('shortBreak')
        setTimeLeft(durations.shortBreak)
      }
    } else {
      setMode('work')
      setTimeLeft(durations.work)
    }
  }, [mode, sessionsCompleted, longBreakInterval, durations, clearTimer, playBeep])

  useEffect(() => {
    if (!isRunning) return

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return clearTimer
  }, [isRunning, handleComplete, clearTimer])

  const start = useCallback(() => setIsRunning(true), [])
  const pause = useCallback(() => setIsRunning(false), [])
  const reset = useCallback(() => {
    clearTimer()
    setIsRunning(false)
    setTimeLeft(durations[mode])
  }, [mode, durations, clearTimer])

  const switchMode = useCallback((newMode: PomodoroMode) => {
    clearTimer()
    setIsRunning(false)
    setMode(newMode)
    setTimeLeft(durations[newMode])
  }, [durations, clearTimer])

  const skip = useCallback(() => {
    handleComplete()
  }, [handleComplete])

  const updateDuration = useCallback((m: PomodoroMode, minutes: number) => {
    const seconds = minutes * 60
    setDurations((prev) => ({ ...prev, [m]: seconds }))
    if (m === mode) {
      clearTimer()
      setIsRunning(false)
      setTimeLeft(seconds)
    }
  }, [mode, clearTimer])

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return {
    mode,
    timeLeft,
    isRunning,
    sessionsCompleted,
    totalSeconds,
    progress,
    formattedTime: formatTime(timeLeft),
    start,
    pause,
    reset,
    skip,
    switchMode,
    updateDuration,
    durations,
  }
}
