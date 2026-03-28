'use client'

import { signIn } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import {
  Brain,
  Timer,
  Music,
  Heart,
  CheckSquare,
  Sparkles,
  Chrome,
  Star,
  Zap,
  Eye,
} from 'lucide-react'

const features = [
  {
    icon: Heart,
    title: 'Camera Health Monitor',
    description: 'Real-time vitals tracking via facial analysis',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
  },
  {
    icon: Brain,
    title: 'AI Study Plans',
    description: 'Personalized suggestions powered by Gemini',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
  },
  {
    icon: Timer,
    title: 'Pomodoro Timer',
    description: 'Smart focus sessions with break reminders',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  {
    icon: Music,
    title: 'Ambient Sounds',
    description: 'Rain, fire, waves and more to boost focus',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
  },
]

interface Particle {
  id: number
  x: number
  y: number
  size: number
  duration: number
  delay: number
  opacity: number
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 10 + 8,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.4 + 0.1,
  }))
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setParticles(generateParticles(40))
    setMounted(true)
  }, [])

  const handleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn('google', { callbackUrl: '/dashboard' })
    } catch {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 flex items-center justify-center">
      {/* Animated gradient background */}
      <div className="absolute inset-0 animated-gradient" />

      {/* Radial gradient overlays */}
      <div className="absolute inset-0 bg-gradient-radial from-violet-950/40 via-transparent to-transparent" />
      <div
        className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full opacity-15 blur-3xl"
        style={{ background: 'radial-gradient(circle, #4f46e5, transparent)' }}
      />
      <div
        className="absolute top-1/2 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl"
        style={{ background: 'radial-gradient(circle, #9333ea, transparent)' }}
      />

      {/* Floating particles */}
      {mounted && particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-violet-400 pointer-events-none"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            opacity: particle.opacity,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [particle.opacity, particle.opacity * 2, particle.opacity],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Orb decorations */}
      <motion.div
        className="absolute w-72 h-72 rounded-full blur-3xl opacity-5"
        style={{ background: 'conic-gradient(from 0deg, #7c3aed, #4f46e5, #7c3aed)', top: '10%', left: '5%' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute w-48 h-48 rounded-full blur-3xl opacity-5"
        style={{ background: 'conic-gradient(from 180deg, #9333ea, #6d28d9, #9333ea)', bottom: '10%', right: '5%' }}
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-12">
        <div className="flex flex-col items-center text-center">

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
            className="mb-8"
          >
            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 animate-glow"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                boxShadow: '0 0 40px rgba(124, 58, 237, 0.5), 0 0 80px rgba(124, 58, 237, 0.2)',
              }}>
              <Sparkles className="w-10 h-10 text-white" />
              <motion.div
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Star className="w-3 h-3 text-white" />
              </motion.div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-4"
          >
            <h1 className="text-6xl md:text-7xl font-black tracking-tight mb-2">
              <span className="gradient-text">Study</span>
              <span className="text-white">Space</span>
            </h1>
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-violet-500" />
              <Zap className="w-4 h-4 text-violet-400" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-violet-500" />
            </div>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-xl text-white/60 max-w-md mb-3"
          >
            Your intelligent study environment
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-sm text-white/30 max-w-sm mb-12"
          >
            Monitor your health, optimize focus, and achieve more with AI-powered tools
          </motion.p>

          {/* Feature grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 w-full max-w-3xl"
          >
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                whileHover={{ scale: 1.05, y: -4 }}
                className={`glass rounded-2xl p-4 flex flex-col items-center gap-3 border ${feature.border} cursor-default`}
              >
                <div className={`p-3 rounded-xl ${feature.bg} border ${feature.border}`}>
                  <feature.icon className={`w-5 h-5 ${feature.color}`} />
                </div>
                <div className="text-center">
                  <p className="text-white text-xs font-semibold leading-tight">{feature.title}</p>
                  <p className="text-white/40 text-xs mt-1 leading-tight">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Sign in button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mb-8"
          >
            <motion.button
              onClick={handleSignIn}
              disabled={isLoading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-semibold text-lg overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 0 0 1px rgba(139, 92, 246, 0.3), 0 20px 40px rgba(0,0,0,0.4)',
              }}
            >
              {/* Hover glow */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.15))' }}
              />

              {/* Shimmer effect */}
              <div className="absolute inset-0 overflow-hidden">
                <motion.div
                  className="absolute inset-0 -skew-x-12"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
                    x: '-100%',
                  }}
                  animate={{ x: ['−100%', '200%'] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                />
              </div>

              {isLoading ? (
                <>
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <div className="relative w-6 h-6 flex-shrink-0">
                    <svg viewBox="0 0 24 24" className="w-6 h-6">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <span>Continue with Google</span>
                </>
              )}
            </motion.button>

            <p className="text-white/25 text-xs mt-4 text-center">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </motion.div>

          {/* Metrics preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="flex items-center gap-6 text-center"
          >
            {[
              { label: 'Active Users', value: '2.4k+' },
              { label: 'Study Hours', value: '48k+' },
              { label: 'Focus Score', value: '94%' },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center">
                <span className="text-2xl font-bold gradient-text">{stat.value}</span>
                <span className="text-white/30 text-xs">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom credit */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-4 left-0 right-0 text-center"
      >
        <p className="text-white/15 text-xs">
          Built for HackPSU Spring 2026 &bull; StudySpace Team
        </p>
      </motion.div>
    </div>
  )
}
