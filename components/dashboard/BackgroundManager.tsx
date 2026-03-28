'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Image, Youtube, Palette, Link } from 'lucide-react'

type BackgroundType = 'gradient' | 'image' | 'youtube'

interface Preset {
  label: string
  value: string
  type: BackgroundType
  preview?: string
}

const GRADIENT_PRESETS: Preset[] = [
  { label: 'Midnight Aurora', value: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)', type: 'gradient' },
  { label: 'Deep Ocean', value: 'linear-gradient(135deg, #000428, #004e92)', type: 'gradient' },
  { label: 'Forest Night', value: 'linear-gradient(135deg, #0a1628, #1a3a2a, #0d2016)', type: 'gradient' },
  { label: 'Nebula', value: 'linear-gradient(135deg, #1a0533, #2d0b6b, #0d1b4b)', type: 'gradient' },
  { label: 'Ember', value: 'linear-gradient(135deg, #1a0505, #3d0c02, #1a0a00)', type: 'gradient' },
  { label: 'Slate', value: 'linear-gradient(135deg, #0f172a, #1e293b, #0f172a)', type: 'gradient' },
]

const IMAGE_PRESETS: Preset[] = [
  {
    label: 'Library',
    value: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&q=80',
    type: 'image',
    preview: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=60',
  },
  {
    label: 'Mountain Night',
    value: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80',
    type: 'image',
    preview: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&q=60',
  },
  {
    label: 'Rainy Window',
    value: 'https://images.unsplash.com/photo-1499346030926-9a72daac6c63?w=1920&q=80',
    type: 'image',
    preview: 'https://images.unsplash.com/photo-1499346030926-9a72daac6c63?w=400&q=60',
  },
  {
    label: 'Forest',
    value: 'https://images.unsplash.com/photo-1476611338391-6f395a0dd82e?w=1920&q=80',
    type: 'image',
    preview: 'https://images.unsplash.com/photo-1476611338391-6f395a0dd82e?w=400&q=60',
  },
  {
    label: 'Foggy Forest',
    value: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1920&q=80',
    type: 'image',
    preview: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=400&q=60',
  },
  {
    label: 'City Lights',
    value: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&q=80',
    type: 'image',
    preview: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&q=60',
  },
]

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

interface BackgroundManagerProps {
  showPanel: boolean
  onClosePanel: () => void
}

export default function BackgroundManager({ showPanel, onClosePanel }: BackgroundManagerProps) {
  const [bgType, setBgType] = useState<BackgroundType>('gradient')
  const [bgValue, setBgValue] = useState(GRADIENT_PRESETS[0].value)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [youtubeId, setYoutubeId] = useState('')
  const [customImageUrl, setCustomImageUrl] = useState('')
  const [overlayOpacity, setOverlayOpacity] = useState(40)
  const [activeTab, setActiveTab] = useState<'gradient' | 'image' | 'youtube'>('gradient')

  const applyYoutube = () => {
    const id = extractYoutubeId(youtubeUrl)
    if (id) {
      setYoutubeId(id)
      setBgType('youtube')
    }
  }

  const applyCustomImage = () => {
    if (customImageUrl) {
      setBgValue(customImageUrl)
      setBgType('image')
    }
  }

  return (
    <>
      {/* Background layer */}
      <div className="absolute inset-0 z-0">
        {bgType === 'gradient' && (
          <div className="absolute inset-0 transition-all duration-1000" style={{ background: bgValue }} />
        )}
        {bgType === 'image' && (
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
            style={{ backgroundImage: `url(${bgValue})` }}
          />
        )}
        {bgType === 'youtube' && youtubeId && (
          <div className="absolute inset-0 overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=0&showinfo=0&modestbranding=1&rel=0&playsinline=1`}
              className="absolute w-[177.78vh] h-[56.25vw] min-w-full min-h-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              allow="autoplay; encrypted-media"
              frameBorder="0"
            />
          </div>
        )}
        {/* Dark overlay */}
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{ background: `rgba(0,0,0,${overlayOpacity / 100})` }}
        />
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30"
              onClick={onClosePanel}
            />
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 bottom-16 z-40 w-80 glass border-l border-white/10 overflow-y-auto"
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest">Background</h3>
                  <button onClick={onClosePanel} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 mb-5">
                  {([
                    { key: 'gradient', label: 'Gradient', icon: Palette },
                    { key: 'image', label: 'Image', icon: Image },
                    { key: 'youtube', label: 'YouTube', icon: Youtube },
                  ] as const).map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                        activeTab === key
                          ? 'bg-violet-500/20 border border-violet-500/30 text-violet-300'
                          : 'text-white/40 hover:text-white/60'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Gradient presets */}
                {activeTab === 'gradient' && (
                  <div className="grid grid-cols-2 gap-2">
                    {GRADIENT_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => { setBgValue(preset.value); setBgType('gradient') }}
                        className={`relative h-16 rounded-xl overflow-hidden border-2 transition-all ${
                          bgType === 'gradient' && bgValue === preset.value
                            ? 'border-violet-500'
                            : 'border-white/10 hover:border-white/30'
                        }`}
                        style={{ background: preset.value }}
                      >
                        <div className="absolute inset-0 flex items-end p-1.5">
                          <span className="text-[10px] font-semibold text-white/70 bg-black/40 rounded px-1">{preset.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Image presets */}
                {activeTab === 'image' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {IMAGE_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          onClick={() => { setBgValue(preset.value); setBgType('image') }}
                          className={`relative h-16 rounded-xl overflow-hidden border-2 transition-all ${
                            bgType === 'image' && bgValue === preset.value
                              ? 'border-violet-500'
                              : 'border-white/10 hover:border-white/30'
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={preset.preview} alt={preset.label} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-end p-1.5 bg-gradient-to-t from-black/60">
                            <span className="text-[10px] font-semibold text-white">{preset.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="Paste image URL..."
                        value={customImageUrl}
                        onChange={(e) => setCustomImageUrl(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50"
                      />
                      <button
                        onClick={applyCustomImage}
                        className="p-2 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-400 hover:bg-violet-500/30 transition-colors"
                      >
                        <Link className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* YouTube */}
                {activeTab === 'youtube' && (
                  <div className="space-y-3">
                    <p className="text-xs text-white/40">Paste a YouTube URL to use as a live video background.</p>
                    <input
                      type="url"
                      placeholder="https://youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && applyYoutube()}
                      className="w-full px-3 py-2 text-xs bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50"
                    />
                    <button
                      onClick={applyYoutube}
                      className="w-full py-2 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-medium hover:bg-violet-500/30 transition-colors flex items-center justify-center gap-2"
                    >
                      <Youtube className="w-3.5 h-3.5" />
                      Apply YouTube Background
                    </button>
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <p className="text-xs text-amber-300/70">Tip: Use lofi/study playlists like &quot;lofi hip hop radio&quot; for best experience.</p>
                    </div>
                  </div>
                )}

                {/* Overlay opacity */}
                <div className="mt-5 pt-5 border-t border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-white/50">Overlay Darkness</label>
                    <span className="text-xs text-white/40">{overlayOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={80}
                    value={overlayOpacity}
                    onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                    className="w-full accent-violet-500"
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
