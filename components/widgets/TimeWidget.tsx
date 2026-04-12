'use client'

import { useState, useEffect } from 'react'
import { X, Clock as ClockIcon } from 'lucide-react'

const OLIVE = '#6b7c42'

export default function TimeWidget() {
  const [time, setTime] = useState({ hours: 0, minutes: 0, seconds: 0 })
  const [isMounted, setIsMounted] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    setIsMounted(true)

    const updateTime = () => {
      const now = new Date()
      setTime({
        hours: now.getHours() % 12,
        minutes: now.getMinutes(),
        seconds: now.getSeconds(),
      })
    }

    updateTime()

    // Update time every second
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  if (!isMounted) return null

  // Calculate rotation angles
  const secondAngle = (time.seconds / 60) * 360
  const minuteAngle = (time.minutes / 60) * 360 + (time.seconds / 60) * 6
  const hourAngle = (time.hours / 12) * 360 + (time.minutes / 60) * 30

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {!isExpanded ? (
        // Collapsed state - small transparent button
        <button
          onClick={() => setIsExpanded(true)}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'rgba(107, 124, 66, 0.15)',
            border: `2px solid rgba(107, 124, 66, 0.4)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease',
            padding: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(107, 124, 66, 0.25)'
            e.currentTarget.style.borderColor = 'rgba(107, 124, 66, 0.6)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(107, 124, 66, 0.15)'
            e.currentTarget.style.borderColor = 'rgba(107, 124, 66, 0.4)'
          }}
          title="Show clock"
        >
          <ClockIcon width={20} height={20} color={OLIVE} strokeWidth={1.8} />
        </button>
      ) : (
        // Expanded state - full clock
        <div style={{ position: 'relative', display: 'inline-block', marginTop: '12px' }}>
          {/* Close button - positioned above and to the right */}
          <button
            onClick={() => setIsExpanded(false)}
            style={{
              position: 'absolute',
              top: '-15px',
              right: '-15px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: OLIVE,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              padding: 0,
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(107, 124, 66, 0.25)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#525c2f'
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(107, 124, 66, 0.35)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = OLIVE
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(107, 124, 66, 0.25)'
            }}
            title="Close clock"
          >
            <X width={18} height={18} color="#fff" strokeWidth={2.5} />
          </button>

          {/* Analog clock */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100px',
              height: '100px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.92) 100%)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              borderRadius: '50%',
              border: `3px solid ${OLIVE}`,
              position: 'relative',
              boxShadow: `0 8px 32px rgba(107, 124, 66, 0.2), 0 0 0 1px rgba(107, 124, 66, 0.1), inset 0 0 15px rgba(107, 124, 66, 0.05)`,
            }}
          >
            <svg
              width="100"
              height="100"
              viewBox="0 0 100 100"
              style={{ position: 'absolute', top: 0, left: 0 }}
            >
              {/* Hour numbers 1-12 */}
              {[...Array(12)].map((_, i) => {
                const number = i === 0 ? 12 : i
                const angle = (i * 30) * (Math.PI / 180)
                const x = 50 + 34 * Math.cos(angle - Math.PI / 2)
                const y = 50 + 34 * Math.sin(angle - Math.PI / 2)
                return (
                  <text
                    key={i}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="12"
                    fontWeight="bold"
                    fill="rgba(0,0,0,0.8)"
                    style={{
                      fontFamily: 'var(--font-nunito), sans-serif',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {number}
                  </text>
                )
              })}

              {/* Hour hand */}
              <line
                x1="50"
                y1="50"
                x2={50 + 18 * Math.cos((hourAngle - 90) * (Math.PI / 180))}
                y2={50 + 18 * Math.sin((hourAngle - 90) * (Math.PI / 180))}
                stroke="rgba(0,0,0,0.8)"
                strokeWidth="3.5"
                strokeLinecap="round"
                style={{
                  filter: `drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))`,
                  transition: 'transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)',
                }}
              />

              {/* Minute hand */}
              <line
                x1="50"
                y1="50"
                x2={50 + 26 * Math.cos((minuteAngle - 90) * (Math.PI / 180))}
                y2={50 + 26 * Math.sin((minuteAngle - 90) * (Math.PI / 180))}
                stroke="rgba(0,0,0,0.8)"
                strokeWidth="2.5"
                strokeLinecap="round"
                style={{
                  filter: `drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))`,
                  transition: 'transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)',
                }}
              />

              {/* Second hand */}
              <line
                x1="50"
                y1="50"
                x2={50 + 28 * Math.cos((secondAngle - 90) * (Math.PI / 180))}
                y2={50 + 28 * Math.sin((secondAngle - 90) * (Math.PI / 180))}
                stroke="#E8A87C"
                strokeWidth="1.5"
                strokeLinecap="round"
                style={{
                  filter: 'drop-shadow(0 0 2px rgba(232, 168, 124, 0.6))',
                }}
              />

              {/* Center dot */}
              <circle
                cx="50"
                cy="50"
                r="3.5"
                fill="rgba(0,0,0,0.8)"
                style={{
                  filter: `drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))`,
                }}
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}
