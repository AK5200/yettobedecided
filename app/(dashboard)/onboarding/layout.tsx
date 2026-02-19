import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function OnboardingLayout({
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

  // Check for organization membership with onboarding status
  const { data: memberships, error } = await supabase
    .from('org_members')
    .select('org_id, organizations(onboarding_completed)')
    .eq('user_id', user.id)
    .limit(1)

  // Only redirect to dashboard if membership exists AND onboarding is completed
  if (!error && memberships && memberships.length > 0) {
    const membership = memberships[0] as any
    if (membership.organizations?.onboarding_completed === true) {
      redirect('/dashboard')
    }
    // Otherwise: membership exists but onboarding incomplete — stay on onboarding
  }

  return <>{children}</>
}
