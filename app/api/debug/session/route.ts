import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  return NextResponse.json({
    hasSession: !!session,
    hasAccessToken: !!session?.accessToken,
    tokenPreview: session?.accessToken ? session.accessToken.slice(0, 20) + '...' : null,
    user: session?.user?.email ?? null,
  })
}
