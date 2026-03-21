import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/sidebar'
import { getCurrentOrg } from '@/lib/org-context'

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
  let orgContext = await getCurrentOrg(supabase)

  // If no memberships, auto-accept any pending invitations for this user's email
  if (!orgContext && user.email) {
    try {
      const adminClient = createAdminClient()
      const { data: invitations } = await adminClient
        .from('invitations')
        .select('*')
        .ilike('email', user.email)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())

      if (invitations && invitations.length > 0) {
        for (const invitation of invitations) {
          await adminClient
            .from('org_members')
            .insert({ org_id: invitation.org_id, user_id: user.id, role: invitation.role })
          await adminClient
            .from('invitations')
            .update({ accepted_at: new Date().toISOString() })
            .eq('id', invitation.id)
        }
        // Re-fetch after auto-accept
        orgContext = await getCurrentOrg(supabase)
      }
    } catch (e) {
      console.error('Auto-accept invitation failed:', e)
    }
  }

  // If no memberships, redirect to onboarding (skip if already on onboarding)
  if (!isOnboarding && !orgContext) {
    redirect('/onboarding')
  }

  // If landing on /dashboard and onboarding not complete, redirect to /onboarding
  const isDashboard = pathname === '/dashboard' || pathname === ''
  if (isDashboard && orgContext?.org?.onboarding_completed === false) {
    redirect('/onboarding')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">{children}</main>
    </div>
  )
}
