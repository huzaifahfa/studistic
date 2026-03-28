import { auth } from '@/lib/auth'
import Dashboard from '@/components/dashboard/Dashboard'

export default async function DashboardPage() {
  // Session is optional — Google sign-in is only needed for calendar features
  const session = await auth()
  return <Dashboard session={session} />
}
