'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User } from 'lucide-react'
import Image from 'next/image'
import { getPublicStats } from '@/lib/studyStats'

export default function LandingPage() {
  const router = useRouter()
  const [stats, setStats] = useState({ hoursStudied: 0, tasksCompleted: 0, totalTasksAdded: 0, streak: 0 })
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    setStats(getPublicStats())
  }, [])

  return (
    <div
      className="w-screen h-screen overflow-hidden flex flex-col relative"
      style={{ 
        backgroundImage: 'url(/Textured%20Paper%20%26%20Cardboard%20-%20Negative%20Space_...jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#f8f4ec',
        fontFamily: 'var(--font-nunito), sans-serif',
        filter: 'saturate(0.6)'
      }}
    >
      {/* Top-right profile icon */}
      {/* Content wrapper with restored saturation */}
      <div style={{ filter: 'saturate(1.5)', position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top-right profile icon */}
      <div className="flex justify-end p-6 pb-0">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer"
          style={{ backgroundColor: '#d4a49a' }}
          onClick={() => router.push('/dashboard')}
        >
          <User className="w-7 h-7 text-white" strokeWidth={1.5} />
        </div>
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8" style={{ marginTop: '-2rem' }}>
        {/* Title with image */}
        <div className="flex items-center justify-center gap-4">
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <h1
              className="text-center leading-none select-none"
              style={{
                fontSize: 'clamp(5rem, 12vw, 9rem)',
                fontWeight: 900,
                color: '#6b7c42',
                fontFamily: 'var(--font-nunito), sans-serif',
                letterSpacing: '-0.02em',
                textShadow: '0 4px 0 rgba(107,124,66,0.15)',
              }}
            >
              StudiStic
            </h1>
          </div>

          {/* Decorative image */}
          <div 
            className="animate-spin" 
            style={{ animationDuration: isHovering ? '1s' : '8s', transition: 'animation-duration 0.3s ease' }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <Image 
              src="/scribbles/Untitled design.png" 
              alt="decorative design" 
              width={170} 
              height={170}
              style={{ objectFit: 'contain' }}
            />
          </div>
        </div>

        {/* Tagline */}
        <p
          className="text-center mt-5 max-w-lg leading-relaxed"
          style={{ color: '#5a5a48', fontSize: '1.35rem', fontWeight: 700 }}
        >
          Set a calm background, manage tasks, music, and time, all in one place,
          <br />
          and let AI guide you with smarter study suggestions.
        </p>

        {/* CTA Button */}
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-8 transition-transform hover:scale-105 active:scale-95"
          style={{
            backgroundColor: '#c4826e',
            color: '#f5f0e4',
            borderRadius: '9999px',
            padding: '0.85rem 2.5rem',
            fontWeight: 700,
            fontSize: '0.85rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-nunito), sans-serif',
            boxShadow: '0 4px 20px rgba(196,130,110,0.35)',
          }}
        >
          Start Studying
        </button>

        {/* Stats cards */}
        <div className="flex gap-5 mt-14 w-full max-w-3xl justify-center flex-wrap">
          {/* Hours Studied */}
          <StatCard
            bg="#f2e9d0"
            labelColor="#c4826e"
            label={<>Hours<br />Studied</>}
            value={stats.hoursStudied}
            unit="hour"
          />

          {/* Task Completed */}
          <StatCard
            bg="#8b9c5a"
            labelColor="#f5f0e4"
            label={<>Task<br />Completed</>}
            value={stats.tasksCompleted}
            unit={`/${stats.totalTasksAdded} task`}
          />

          {/* Current Streak */}
          <StatCard
            bg="#c4826e"
            labelColor="#f5f0e4"
            label={<>Current<br />Streak</>}
            value={stats.streak}
            unit="days"
          />
        </div>
      </div>
      </div>
    </div>
  )
}

function StatCard({
  bg,
  labelColor,
  label,
  value,
  unit,
}: {
  bg: string
  labelColor: string
  label: React.ReactNode
  value: number
  unit: string
}) {
  return (
    <div
      className="flex flex-col justify-between"
      style={{
        backgroundColor: bg,
        borderRadius: '2rem',
        padding: '2rem',
        width: '220px',
        minHeight: '200px',
      }}
    >
      <h2
        style={{
          color: labelColor,
          fontFamily: 'var(--font-nunito), sans-serif',
          fontWeight: 800,
          fontSize: '1.65rem',
          lineHeight: 1.2,
        }}
      >
        {label}
      </h2>
      <div className="flex items-baseline gap-1 mt-4">
        <span
          style={{
            color: '#1a1a1a',
            fontFamily: 'var(--font-nunito), sans-serif',
            fontWeight: 900,
            fontSize: '3.5rem',
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        <span
          style={{
            color: '#1a1a1a',
            fontFamily: 'var(--font-nunito), sans-serif',
            fontWeight: 700,
            fontSize: '1.2rem',
          }}
        >
          {unit}
        </span>
      </div>
    </div>
  )
}
