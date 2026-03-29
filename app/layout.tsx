import type { Metadata } from 'next'
import { Inter, Nunito } from 'next/font/google'
import './globals.css'
import { SessionProvider } from 'next-auth/react'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito', weight: ['400', '600', '700', '800', '900'], display: 'swap' })

export const metadata: Metadata = {
  title: 'StudiStic',
  description: 'AI-powered study environment with health monitoring.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${nunito.variable} font-sans antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
