import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrg } from '@/lib/org-context'

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

  const orgContext = await getCurrentOrg(supabase)

  // Only redirect to dashboard if membership exists AND onboarding is completed
  if (orgContext && orgContext.org.onboarding_completed === true) {
    redirect('/dashboard')
  }
  // Otherwise: no membership or onboarding incomplete — stay on onboarding

  return <>{children}</>
}
