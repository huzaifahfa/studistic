import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SessionProvider } from 'next-auth/react'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'StudySpace - Your Intelligent Study Environment',
  description: 'AI-powered study space with health monitoring, ambient sounds, and smart productivity tools.',
  keywords: ['study', 'productivity', 'pomodoro', 'focus', 'AI', 'health monitoring'],
  authors: [{ name: 'StudySpace Team' }],
  openGraph: {
    title: 'StudySpace',
    description: 'Your intelligent study environment',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-zinc-950 text-white`}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
