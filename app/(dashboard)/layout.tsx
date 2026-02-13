import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get current path to check if we're already on onboarding
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || headersList.get('x-invoke-path') || ''
  const isOnboarding = pathname.includes('/onboarding')

  // Check for organization membership with error handling
  const { data: memberships, error } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .limit(1)

  // If there's an error (e.g., RLS policy issue) or no memberships, redirect to onboarding
  // Skip redirect if already on onboarding to prevent infinite loop
  if (!isOnboarding && (error || !memberships || memberships.length === 0)) {
    redirect('/onboarding')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">{children}</main>
    </div>
  )
}
