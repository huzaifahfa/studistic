'use client'

import { useState } from 'react'
import { Music2, Link, ExternalLink } from 'lucide-react'
import Widget from './Widget'

function toSpotifyEmbedUrl(url: string): string | null {
  // Match: https://open.spotify.com/{type}/{id}
  const match = url.match(/open\.spotify\.com\/(playlist|album|track|artist|episode|show)\/([a-zA-Z0-9]+)/)
  if (!match) return null
  const [, type, id] = match
  return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`
}

const DEFAULTS = [
  { label: 'Lofi Hip Hop', url: 'https://open.spotify.com/embed/playlist/0vvXsWCC9xrXsKd4eZs6e1?utm_source=generator&theme=0' },
  { label: 'Deep Focus', url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ?utm_source=generator&theme=0' },
  { label: 'Study Beats', url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX8NTLI2TtZa6?utm_source=generator&theme=0' },
]

interface SpotifyEmbedProps {
  onClose?: () => void
  defaultPosition?: { x: number; y: number }
}

export default function SpotifyEmbed({ onClose, defaultPosition }: SpotifyEmbedProps) {
  const [inputUrl, setInputUrl] = useState('')
  const [embedUrl, setEmbedUrl] = useState(DEFAULTS[0].url)
  const [error, setError] = useState('')

  const applyUrl = () => {
    if (!inputUrl.trim()) return
    const embed = toSpotifyEmbedUrl(inputUrl.trim())
    if (embed) {
      setEmbedUrl(embed)
      setError('')
    } else {
      setError('Invalid Spotify URL. Use a playlist, album, or track link.')
    }
  }

  return (
    <Widget
      title="Spotify"
      onClose={onClose}
      defaultPosition={defaultPosition || { x: 80, y: 520 }}
      minWidth={300}
      accentColor="#1db954"
    >
      <div style={{ minWidth: 280 }}>
        {/* Quick picks */}
        <div className="flex gap-1.5 mb-3">
          {DEFAULTS.map((d) => (
            <button
              key={d.label}
              onClick={() => setEmbedUrl(d.url)}
              className={`flex-1 py-1 rounded-lg text-[10px] font-medium transition-all border ${
                embedUrl === d.url
                  ? 'bg-green-500/20 border-green-500/30 text-green-300'
                  : 'border-white/10 text-white/40 hover:text-white/60 hover:border-white/20'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Embed iframe */}
        <div className="rounded-xl overflow-hidden mb-3" style={{ height: 152 }}>
          <iframe
            src={embedUrl}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-xl"
          />
        </div>

        {/* Custom URL input */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Music2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              type="url"
              placeholder="Paste Spotify URL..."
              value={inputUrl}
              onChange={(e) => { setInputUrl(e.target.value); setError('') }}
              onKeyDown={(e) => e.key === 'Enter' && applyUrl()}
              className="w-full pl-8 pr-3 py-2 text-xs bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
            />
          </div>
          <button
            onClick={applyUrl}
            className="p-2 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors"
          >
            <Link className="w-3.5 h-3.5" />
          </button>
          <a
            href="https://open.spotify.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white/70 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
        {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
      </div>
    </Widget>
  )
}
