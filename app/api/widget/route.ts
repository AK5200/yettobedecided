import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { handleOptions, withCors } from '@/lib/cors'

export const dynamic = 'force-dynamic'

const defaultSettings = {
  widget_type: 'all-in-one',
  position: 'bottom-right',
  accent_color: '#000000',
  button_text: 'Feedback',
  show_branding: true,
  theme: 'light',
}

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request)
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  const { searchParams } = new URL(request.url)
  const orgSlug = searchParams.get('org')

  if (!orgSlug) {
    return withCors(
      NextResponse.json({ error: 'org is required' }, { status: 400 }),
      origin
    )
  }

  // Use admin client for all queries — this is a public-facing endpoint
  // called from the widget iframe where visitors are unauthenticated.
  // Regular createClient() would fail RLS on organizations table.
  const adminClient = createAdminClient()

  const { data: org, error: orgError } = await adminClient
    .from('organizations')
    .select('id, name, slug, logo_url, description, guest_posting_enabled, guest_commenting_enabled, guest_voting_enabled, login_handler, sso_redirect_url')
    .eq('slug', orgSlug)
    .single()

  if (orgError || !org) {
    return withCors(
      NextResponse.json({ error: 'Organization not found' }, { status: 404 }),
      origin
    )
  }

  const { data: settings } = await adminClient
    .from('widget_settings')
    .select('*')
    .eq('org_id', org.id)
    .single()

  const { data: boards } = await adminClient
    .from('boards')
    .select('id,name,slug')
    .eq('org_id', org.id)
    .eq('is_public', true)

  const { data: changelog } = await adminClient
    .from('changelog_entries')
    .select('*')
    .eq('org_id', org.id)
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(10)

  // Fetch posts for all public boards
  let allPosts: any[] = []
  if (boards && boards.length > 0) {
    const boardIds = boards.map((b: any) => b.id)
    const { data: posts } = await adminClient
      .from('posts')
      .select('id, title, content, vote_count, status, created_at, author_name, guest_name, is_pinned, board_id, user_source')
      .in('board_id', boardIds)
      .is('merged_into_id', null)
      .eq('is_approved', true)
      .order('is_pinned', { ascending: false })
      .order('vote_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50)
    allPosts = posts || []
  }

  const response = NextResponse.json({
    org,
    settings: settings || { ...defaultSettings, org_id: org.id },
    boards: boards || [],
    changelog: changelog || [],
    posts: allPosts,
    auth: {
      guestPostingEnabled: org.guest_posting_enabled !== false,
      guestCommentingEnabled: org.guest_commenting_enabled !== false,
      guestVotingEnabled: org.guest_voting_enabled !== false,
      loginHandler: org.login_handler || null,
      ssoRedirectUrl: org.sso_redirect_url || null,
    },
  })
  response.headers.set('Cache-Control', 'no-cache')
  return withCors(response, origin)
}
