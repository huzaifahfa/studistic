'use client'

import { signIn, signOut } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  Timer, CheckSquare, Music, Volume2, Image, Camera, CameraOff,
  Sparkles, CalendarDays, LogOut
} from 'lucide-react'
import { useState } from 'react'
import type { Session } from 'next-auth'

interface ToolbarProps {
  widgets: { pomodoro: boolean; todo: boolean; spotify: boolean; soundboard: boolean }
  onToggleWidget: (key: 'pomodoro' | 'todo' | 'spotify' | 'soundboard') => void
  onToggleBackground: () => void
  onToggleCamera: () => void
  cameraEnabled: boolean
  user: Session['user'] | undefined
}

const ToolBtn = ({
  icon: Icon,
  label,
  active,
  onClick,
  accent,
}: {
  icon: React.ElementType
  label: string
  active?: boolean
  onClick: () => void
  accent?: string
}) => (
  <motion.button
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    title={label}
    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all group ${
      active
        ? 'bg-violet-500/20 border border-violet-500/30'
        : 'hover:bg-white/10 border border-transparent'
    }`}
  >
    <Icon
      className={`w-5 h-5 transition-colors ${
        active ? 'text-violet-400' : 'text-white/50 group-hover:text-white/80'
      }`}
      style={active && accent ? { color: accent } : undefined}
    />
    <span className={`text-[10px] font-medium transition-colors ${active ? 'text-violet-300' : 'text-white/30 group-hover:text-white/50'}`}>
      {label}
    </span>
  </motion.button>
)

export default function Toolbar({
  widgets,
  onToggleWidget,
  onToggleBackground,
  onToggleCamera,
  cameraEnabled,
  user,
}: ToolbarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between px-6 py-2 backdrop-blur-2xl border-t border-white/10"
        style={{ background: 'rgba(0,0,0,0.55)' }}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 min-w-[140px]">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 0 12px rgba(124,58,237,0.4)' }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-white/80 tracking-wide">StudySpace</span>
        </div>

        {/* Widget toggles */}
        <div className="flex items-center gap-1">
          <ToolBtn
            icon={Timer}
            label="Pomodoro"
            active={widgets.pomodoro}
            onClick={() => onToggleWidget('pomodoro')}
            accent="#ef4444"
          />
          <ToolBtn
            icon={CheckSquare}
            label="To-Do"
            active={widgets.todo}
            onClick={() => onToggleWidget('todo')}
            accent="#22c55e"
          />
          <ToolBtn
            icon={Music}
            label="Spotify"
            active={widgets.spotify}
            onClick={() => onToggleWidget('spotify')}
            accent="#1db954"
          />
          <ToolBtn
            icon={Volume2}
            label="Sounds"
            active={widgets.soundboard}
            onClick={() => onToggleWidget('soundboard')}
            accent="#06b6d4"
          />
          <div className="w-px h-8 bg-white/10 mx-1" />
          <ToolBtn
            icon={Image}
            label="Scene"
            onClick={onToggleBackground}
          />
        </div>

        {/* Right side: camera + user */}
        <div className="flex items-center gap-2 min-w-[140px] justify-end">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onToggleCamera}
            title={cameraEnabled ? 'Disable camera' : 'Enable camera'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
              cameraEnabled
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-white/5 border-white/10 text-white/40'
            }`}
          >
            {cameraEnabled ? <Camera className="w-3.5 h-3.5" /> : <CameraOff className="w-3.5 h-3.5" />}
            {cameraEnabled ? 'Live' : 'Off'}
          </motion.button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/10 transition-colors border border-green-500/30 bg-green-500/10"
              >
                <CalendarDays className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs text-green-300 max-w-[80px] truncate">{user.name?.split(' ')[0]}</span>
              </button>

              {showUserMenu && (
                <div className="absolute bottom-full right-0 mb-2 glass rounded-xl border border-white/10 p-2 min-w-[160px]">
                  <div className="px-3 py-2 border-b border-white/10 mb-1">
                    <p className="text-xs font-semibold text-white/80 truncate">{user.name}</p>
                    <p className="text-[10px] text-white/40 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => signOut({ redirect: false })}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-red-500/10 text-white/50 hover:text-red-400 transition-colors text-xs"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Disconnect calendar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => signIn('google')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-white/10 bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10 hover:border-white/20 transition-all"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Connect Calendar
            </motion.button>
          )}
        </div>
      </div>
    </div>
  )
}
