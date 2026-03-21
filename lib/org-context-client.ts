import { createClient } from '@/lib/supabase/client'
import { ORG_COOKIE_NAME } from '@/lib/org-constants'

/**
 * Client-side: Get the current org ID from cookie, validated against membership.
 * Falls back to first org if cookie is invalid.
 */
export async function getClientOrgId(): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const savedOrgId = document.cookie
    .split('; ')
    .find(c => c.startsWith(ORG_COOKIE_NAME + '='))
    ?.split('=')[1]

  if (savedOrgId) {
    // Validate membership
    const { data } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .eq('org_id', savedOrgId)
      .maybeSingle()

    if (data) return data.org_id
  }

  // Fallback: get first membership
  const { data } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (data) {
    // Set the cookie for future use
    document.cookie = `${ORG_COOKIE_NAME}=${data.org_id}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
    return data.org_id
  }

  return null
}
