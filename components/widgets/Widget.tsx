'use client'

import { useState, useRef } from 'react'
import Draggable from 'react-draggable'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus, GripHorizontal } from 'lucide-react'

interface WidgetProps {
  title: string
  children: React.ReactNode
  onClose?: () => void
  defaultPosition?: { x: number; y: number }
  className?: string
  minWidth?: number
  minHeight?: number
  headerExtra?: React.ReactNode
  accentColor?: string
}

export default function Widget({
  title,
  children,
  onClose,
  defaultPosition = { x: 100, y: 100 },
  className = '',
  minWidth = 280,
  headerExtra,
  accentColor = '#8b5cf6',
}: WidgetProps) {
  const [minimized, setMinimized] = useState(false)
  const nodeRef = useRef<HTMLDivElement>(null)

  return (
    <Draggable
      nodeRef={nodeRef as React.RefObject<HTMLElement>}
      defaultPosition={defaultPosition}
      handle=".widget-drag-handle"
      bounds="parent"
    >
      <motion.div
        ref={nodeRef}
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`widget absolute select-none ${className}`}
        style={{ minWidth, zIndex: 10 }}
      >
        {/* Header / Drag Handle */}
        <div
          className="widget-drag-handle flex items-center justify-between px-4 py-3 border-b border-white/10"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <div className="flex items-center gap-2">
            <GripHorizontal className="w-3.5 h-3.5 text-white/20" />
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: accentColor, boxShadow: `0 0 8px ${accentColor}` }}
            />
            <span className="text-sm font-semibold text-white/80 tracking-wide">{title}</span>
          </div>
          <div className="flex items-center gap-1">
            {headerExtra}
            <button
              onClick={(e) => { e.stopPropagation(); setMinimized((v) => !v) }}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white/70"
            >
              <Minus className="w-3 h-3" />
            </button>
            {onClose && (
              <button
                onClick={(e) => { e.stopPropagation(); onClose() }}
                className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors text-white/40 hover:text-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <AnimatePresence>
          {!minimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-4">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Draggable>
  )
}
