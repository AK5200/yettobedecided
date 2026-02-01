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

  // Check for organization membership with error handling
  // If there's an error (e.g., RLS policy not fixed yet), allow user to stay on onboarding
  const { data: memberships, error } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .limit(1)

  // Only redirect to dashboard if we successfully found memberships
  // If there's an error, let the user create an organization
  if (!error && memberships && memberships.length > 0) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
