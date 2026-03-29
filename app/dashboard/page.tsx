import { auth } from '@/lib/auth'
import Dashboard from '@/components/dashboard/Dashboard'

export default async function DashboardPage() {
  const session = await auth()
  return <Dashboard session={session} />
}
