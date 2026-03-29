import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/calendar',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
      }
      // Refresh if token expires within 60 seconds
      const expiresAt = token.expiresAt as number | undefined
      if (expiresAt && Date.now() / 1000 > expiresAt - 60 && token.refreshToken) {
        try {
          const res = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID!,
              client_secret: process.env.GOOGLE_CLIENT_SECRET!,
              grant_type: 'refresh_token',
              refresh_token: token.refreshToken as string,
            }),
          })
          const refreshed = await res.json()
          if (refreshed.access_token) {
            token.accessToken = refreshed.access_token
            token.expiresAt = Math.floor(Date.now() / 1000) + refreshed.expires_in
          }
        } catch { /* keep old token */ }
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      if (session.user) session.user.id = token.sub ?? ''
      return session
    },
  },
})

declare module 'next-auth' {
  interface Session { accessToken?: string }
  interface User { id?: string }
}
