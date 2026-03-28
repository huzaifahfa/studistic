'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Volume2, VolumeX } from 'lucide-react'
import Widget from './Widget'

interface Sound {
  id: string
  label: string
  emoji: string
  color: string
}

const SOUNDS: Sound[] = [
  { id: 'rain', label: 'Rain', emoji: '🌧️', color: '#3b82f6' },
  { id: 'whitenoise', label: 'White Noise', emoji: '🌫️', color: '#94a3b8' },
  { id: 'brownnoise', label: 'Brown Noise', emoji: '🟤', color: '#92400e' },
  { id: 'fire', label: 'Fireplace', emoji: '🔥', color: '#f97316' },
  { id: 'waves', label: 'Ocean', emoji: '🌊', color: '#06b6d4' },
  { id: 'wind', label: 'Wind', emoji: '💨', color: '#a78bfa' },
  { id: 'birds', label: 'Birds', emoji: '🐦', color: '#22c55e' },
  { id: 'coffee', label: 'Café', emoji: '☕', color: '#d97706' },
]

function createNoiseSource(
  ctx: AudioContext,
  type: string,
  gainNode: GainNode
): { source: ScriptProcessorNode | OscillatorNode; stop: () => void } {
  if (type === 'waves') {
    // Sine oscillator modulated with LFO for wave-like effect
    const osc = ctx.createOscillator()
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    osc.frequency.value = 0.5
    osc.type = 'sine'
    lfo.frequency.value = 0.1
    lfo.type = 'sine'
    lfoGain.gain.value = 150
    lfo.connect(lfoGain)
    lfoGain.connect(osc.frequency)
    osc.connect(gainNode)
    osc.start()
    lfo.start()
    return {
      source: osc,
      stop: () => { try { osc.stop(); lfo.stop() } catch { /* ignore */ } },
    }
  }

  if (type === 'birds') {
    const oscillators: OscillatorNode[] = []
    let stopped = false
    const scheduleChirp = () => {
      if (stopped) return
      const osc = ctx.createOscillator()
      const envGain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = 2000 + Math.random() * 2000
      envGain.gain.setValueAtTime(0, ctx.currentTime)
      envGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05)
      envGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15)
      osc.connect(envGain)
      envGain.connect(gainNode)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.2)
      oscillators.push(osc)
      setTimeout(scheduleChirp, 500 + Math.random() * 2000)
    }
    scheduleChirp()
    const dummyOsc = ctx.createOscillator()
    return {
      source: dummyOsc,
      stop: () => { stopped = true },
    }
  }

  // ScriptProcessor noise for rain, white, brown, fire, wind, coffee
  const bufferSize = 4096
  const processor = ctx.createScriptProcessor(bufferSize, 1, 1)

  let lastOut = 0
  processor.onaudioprocess = (e) => {
    const output = e.outputBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1

      if (type === 'whitenoise') {
        output[i] = white
      } else if (type === 'brownnoise' || type === 'coffee') {
        lastOut = (lastOut + 0.02 * white) / 1.02
        output[i] = lastOut * 3.5
      } else if (type === 'rain') {
        // White noise with random intensity spikes
        const spike = Math.random() < 0.005 ? Math.random() * 0.8 : 0
        output[i] = white * 0.3 + spike
      } else if (type === 'fire') {
        lastOut = (lastOut + 0.05 * white) / 1.05
        const crackle = Math.random() < 0.003 ? (Math.random() * 2 - 1) * 0.7 : 0
        output[i] = lastOut * 2 + crackle
      } else if (type === 'wind') {
        // High-frequency filtered noise
        output[i] = white * 0.5
      }
    }
  }

  processor.connect(gainNode)

  if (type === 'rain') {
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 800
    filter.Q.value = 0.5
    processor.disconnect()
    processor.connect(filter)
    filter.connect(gainNode)
  }

  if (type === 'wind') {
    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 600
    processor.disconnect()
    processor.connect(filter)
    filter.connect(gainNode)
  }

  return {
    source: processor,
    stop: () => { try { processor.disconnect() } catch { /* ignore */ } },
  }
}

interface ActiveSound {
  gainNode: GainNode
  stop: () => void
  volume: number
}

interface SounboardProps {
  onClose?: () => void
  defaultPosition?: { x: number; y: number }
}

export default function Soundboard({ onClose, defaultPosition }: SounboardProps) {
  const [activeSounds, setActiveSounds] = useState<Record<string, ActiveSound>>({})
  const [masterVolume, setMasterVolume] = useState(0.7)
  const ctxRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      const ctx = new AudioContext()
      const master = ctx.createGain()
      master.gain.value = masterVolume
      master.connect(ctx.destination)
      ctxRef.current = ctx
      masterGainRef.current = master
    }
    return { ctx: ctxRef.current, master: masterGainRef.current! }
  }, [masterVolume])

  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = masterVolume
    }
  }, [masterVolume])

  const toggleSound = useCallback((sound: Sound) => {
    if (activeSounds[sound.id]) {
      activeSounds[sound.id].stop()
      activeSounds[sound.id].gainNode.disconnect()
      setActiveSounds((prev) => {
        const next = { ...prev }
        delete next[sound.id]
        return next
      })
    } else {
      const { ctx, master } = getCtx()
      if (ctx.state === 'suspended') ctx.resume()
      const gainNode = ctx.createGain()
      gainNode.gain.value = 0.5
      gainNode.connect(master)
      const { stop } = createNoiseSource(ctx, sound.id, gainNode)
      setActiveSounds((prev) => ({
        ...prev,
        [sound.id]: { gainNode, stop, volume: 0.5 },
      }))
    }
  }, [activeSounds, getCtx])

  const setVolume = (id: string, vol: number) => {
    if (activeSounds[id]) {
      activeSounds[id].gainNode.gain.value = vol
      setActiveSounds((prev) => ({
        ...prev,
        [id]: { ...prev[id], volume: vol },
      }))
    }
  }

  return (
    <Widget
      title="Ambient Sounds"
      onClose={onClose}
      defaultPosition={defaultPosition || { x: 420, y: 520 }}
      minWidth={300}
      accentColor="#06b6d4"
    >
      <div style={{ minWidth: 280 }}>
        {/* Sound grid */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {SOUNDS.map((sound) => {
            const active = !!activeSounds[sound.id]
            return (
              <motion.button
                key={sound.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => toggleSound(sound)}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all ${
                  active
                    ? 'border-2'
                    : 'bg-white/5 border-white/10 hover:border-white/25'
                }`}
                style={active ? {
                  background: `${sound.color}15`,
                  borderColor: `${sound.color}60`,
                  boxShadow: `0 0 12px ${sound.color}20`,
                } : {}}
              >
                <span className="text-xl">{sound.emoji}</span>
                <span className={`text-[10px] font-medium ${active ? 'text-white/80' : 'text-white/40'}`}>
                  {sound.label}
                </span>
                {active && (
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: sound.color }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Active sound sliders */}
        {Object.entries(activeSounds).length > 0 && (
          <div className="space-y-2 mb-4 pt-3 border-t border-white/10">
            <p className="text-xs text-white/30 uppercase tracking-wider mb-2">Volume Mix</p>
            {Object.entries(activeSounds).map(([id, active]) => {
              const sound = SOUNDS.find((s) => s.id === id)!
              return (
                <div key={id} className="flex items-center gap-2">
                  <span className="text-sm">{sound.emoji}</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={active.volume}
                    onChange={(e) => setVolume(id, Number(e.target.value))}
                    className="flex-1 h-1"
                    style={{ accentColor: sound.color }}
                  />
                  <span className="text-xs text-white/30 w-7 text-right">{Math.round(active.volume * 100)}%</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Master volume */}
        <div className="flex items-center gap-2 pt-3 border-t border-white/10">
          {masterVolume === 0 ? (
            <VolumeX className="w-3.5 h-3.5 text-white/30" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-white/50" />
          )}
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={masterVolume}
            onChange={(e) => setMasterVolume(Number(e.target.value))}
            className="flex-1 accent-cyan-500"
          />
          <span className="text-xs text-white/30 w-7 text-right">{Math.round(masterVolume * 100)}%</span>
        </div>
      </div>
    </Widget>
  )
}
