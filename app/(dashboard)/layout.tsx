import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient, createAdminClient } from '@/lib/supabase/server'
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
  let { data: memberships, error } = await supabase
    .from('org_members')
    .select('org_id, role, organizations(onboarding_completed)')
    .eq('user_id', user.id)
    .limit(1)

  // If no memberships, auto-accept any pending invitations for this user's email
  if (!error && (!memberships || memberships.length === 0) && user.email) {
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
        // Re-fetch memberships after auto-accept
        const refreshed = await supabase
          .from('org_members')
          .select('org_id, role, organizations(onboarding_completed)')
          .eq('user_id', user.id)
          .limit(1)
        memberships = refreshed.data
        error = refreshed.error
      }
    } catch (e) {
      console.error('Auto-accept invitation failed:', e)
    }
  }

  // If there's an error (e.g., RLS policy issue) or no memberships, redirect to onboarding
  // Skip redirect if already on onboarding to prevent infinite loop
  if (!isOnboarding && (error || !memberships || memberships.length === 0)) {
    redirect('/onboarding')
  }

  // If landing on /dashboard and onboarding not complete, redirect to /onboarding as first page
  const isDashboard = pathname === '/dashboard' || pathname === ''
  if (isDashboard && memberships && memberships.length > 0) {
    const membership = memberships[0] as any
    if (membership.organizations?.onboarding_completed === false) {
      redirect('/onboarding')
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">{children}</main>
    </div>
  )
}
