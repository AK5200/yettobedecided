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
    .select('id, name, slug, logo_url, guest_posting_enabled, social_login_enabled, sso_redirect_enabled, sso_redirect_url')
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

  return withCors(
    NextResponse.json({
      org: { name: org.name, slug: org.slug, logo: org.logo_url },
      auth: {
        guestPostingEnabled: org.guest_posting_enabled,
        socialLoginEnabled: org.social_login_enabled,
        ssoRedirectEnabled: org.sso_redirect_enabled,
        ssoRedirectUrl: org.sso_redirect_url,
      },
      boards: boards || [],
    }),
    origin
  )
}
