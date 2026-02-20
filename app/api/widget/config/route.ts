import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { handleOptions, withCors } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request)
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  const { searchParams } = new URL(request.url)
  const orgSlug = searchParams.get('org')

  if (!orgSlug) {
    return withCors(
      NextResponse.json({ error: 'org required' }, { status: 400 }),
      origin
    )
  }

  const client = createAdminClient()

  const { data: org } = await client
    .from('organizations')
    .select('id, name, slug, logo_url, guest_posting_enabled, social_login_enabled, login_handler, sso_redirect_enabled, sso_redirect_url')
    .eq('slug', orgSlug)
    .single()

  if (!org) {
    return withCors(
      NextResponse.json({ error: 'Not found' }, { status: 404 }),
      origin
    )
  }

  const { data: boards } = await client
    .from('boards')
    .select('id, name, slug')
    .eq('org_id', org.id)
    .eq('is_public', true)

  // Determine login handler: use login_handler if set, otherwise fallback to social_login_enabled for backward compatibility
  const loginHandler = org.login_handler || (org.social_login_enabled ? 'kelo' : null)

  return withCors(
    NextResponse.json({
      org: { name: org.name, slug: org.slug, logo: org.logo_url },
      auth: {
        guestPostingEnabled: org.guest_posting_enabled,
        loginHandler: loginHandler,
        socialLoginEnabled: loginHandler === 'kelo', // Keep for backward compatibility
        ssoRedirectEnabled: loginHandler === 'customer',
        ssoRedirectUrl: org.sso_redirect_url,
      },
      boards: boards || [],
    }),
    origin
  )
}
