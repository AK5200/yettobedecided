import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { ORG_COOKIE_NAME } from '@/lib/org-constants'

/**
 * Server-side: Get the current organization for the authenticated user.
 * Reads from cookie, validates membership, falls back to first org.
 * Returns null if user has no org memberships.
 */
export async function getCurrentOrg(supabase?: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) {
    supabase = await createClient()
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const cookieStore = await cookies()
  const savedOrgId = cookieStore.get(ORG_COOKIE_NAME)?.value

  // Fetch all memberships for this user
  const { data: memberships, error } = await supabase
    .from('org_members')
    .select('org_id, role, organizations(id, name, slug, onboarding_completed, plan, logo_url)')
    .eq('user_id', user.id)

  if (error || !memberships || memberships.length === 0) return null

  // If cookie is set, validate it's a valid membership
  let currentMembership = savedOrgId
    ? memberships.find(m => m.org_id === savedOrgId)
    : null

  // Fall back to first membership if cookie is invalid or not set
  if (!currentMembership) {
    currentMembership = memberships[0]
  }

  const org = currentMembership.organizations as any

  return {
    orgId: currentMembership.org_id as string,
    role: currentMembership.role as string,
    org: org as {
      id: string
      name: string
      slug: string
      onboarding_completed: boolean
      plan: string
      logo_url: string | null
    },
    allMemberships: memberships.map(m => ({
      orgId: m.org_id as string,
      role: m.role as string,
      org: m.organizations as any as {
        id: string
        name: string
        slug: string
        onboarding_completed: boolean
        plan: string
        logo_url: string | null
      },
    })),
  }
}

// Re-export for convenience
export { ORG_COOKIE_NAME } from '@/lib/org-constants'
