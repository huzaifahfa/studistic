'use client'

import { useRef, useEffect } from 'react'

interface BackgroundVideoProps {
  src: string
  isPlaying: boolean
  onVideoRef?: (ref: HTMLVideoElement | null) => void
}

export default function BackgroundVideo({ src, isPlaying, onVideoRef }: BackgroundVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (onVideoRef) {
      onVideoRef(videoRef.current)
    }
  }, [onVideoRef])

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {
          // Handle autoplay restrictions
        })
      } else {
        videoRef.current.pause()
      }
    }
  }, [isPlaying])

  return (
    <div className="video-container" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
      <video
        ref={videoRef}
        loop
        muted
        playsInline
        className="background-video"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  )
}