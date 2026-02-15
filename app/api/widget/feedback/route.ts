import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { processIdentifiedUser } from '@/lib/sso'
import { incrementCounter, upsertWidgetUser } from '@/lib/widget-users'
import { handleOptions, withCors } from '@/lib/cors'
import { notifyIntegrations } from '@/lib/integrations/notify'
import { autoSyncToLinear } from '@/lib/linear/auto-sync'

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request)
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const supabase = await createClient()
  const body = await request.json()
  const { org_slug, board_id, title, content, guest_email, guest_name, identified_user } = body

  if (!org_slug || !board_id || !title) {
    return withCors(
      NextResponse.json({ error: 'org_slug, board_id, and title are required' }, { status: 400 }),
      origin
    )
  }

  // Get org settings
  const { data: org } = await supabase
    .from('organizations')
    .select('id, guest_posting_enabled, sso_secret_key')
    .eq('slug', org_slug)
    .single()

  if (!org) {
    return withCors(
      NextResponse.json({ error: 'Organization not found' }, { status: 404 }),
      origin
    )
  }

  const { data: board } = await supabase
    .from('boards')
    .select('id, require_approval, org_id')
    .eq('id', board_id)
    .eq('org_id', org.id)
    .single()

  if (!board) {
    return withCors(
      NextResponse.json({ error: 'Board not found' }, { status: 404 }),
      origin
    )
  }

  // Process identified user
  const ssoResult = processIdentifiedUser(identified_user, org?.sso_secret_key || null)
  if (ssoResult.error) {
    return withCors(
      NextResponse.json({ error: ssoResult.error }, { status: 401 }),
      origin
    )
  }
  const sourceForRow = ssoResult.source === 'verified_jwt' ? 'verified_sso' : ssoResult.source

  // Use identified email/name if available, otherwise fall back to guest/author fields
  const email = ssoResult.user?.email || guest_email
  const name = ssoResult.user?.name || guest_name

  if (!email && !org.guest_posting_enabled) {
    return withCors(
      NextResponse.json({ error: 'Guest posting is disabled' }, { status: 403 }),
      origin
    )
  }

  if (!email) {
    return withCors(
      NextResponse.json({ error: 'Email is required' }, { status: 400 }),
      origin
    )
  }

  const { user: widgetUser, error: userError } = await upsertWidgetUser(org.id, {
    external_id: ssoResult.user?.id,
    email,
    name,
    avatar_url: ssoResult.user?.avatar,
    user_source: ssoResult.source,
    company_id: ssoResult.user?.company?.id,
    company_name: ssoResult.user?.company?.name,
    company_plan: ssoResult.user?.company?.plan,
    company_monthly_spend: ssoResult.user?.company?.monthlySpend,
  })

  if (userError) {
    return withCors(
      NextResponse.json({ error: userError }, { status: 500 }),
      origin
    )
  }

  if (widgetUser?.is_banned) {
    return withCors(
      NextResponse.json({ error: 'User is banned' }, { status: 403 }),
      origin
    )
  }

  const insertData = {
    board_id,
    title,
    content: content || null,
    author_email: null,
    author_name: null,
    guest_email: email,
    guest_name: name || 'Anonymous',
    is_guest: true,
    widget_user_id: widgetUser?.id || null,
    identified_user_id: ssoResult.user?.id || null,
    identified_user_avatar: ssoResult.user?.avatar || null,
    user_source: sourceForRow,
    is_approved: !board.require_approval,
    status: 'open',
  }

  const { data: post, error } = await supabase.from('posts').insert(insertData).select().single()

  if (error) {
    return withCors(
      NextResponse.json({ error: error.message }, { status: 500 }),
      origin
    )
  }

  if (widgetUser?.id) {
    await incrementCounter(widgetUser.id, 'post_count')
  }

  // Notify integrations (Slack, Discord, etc.)
  const host = request.headers.get('host') || 'localhost:3000'
  const protocol = request.headers.get('x-forwarded-proto') || 'https'
  const baseUrl = `${protocol}://${host}`

  await notifyIntegrations({
    orgId: board.org_id,
    type: 'new_feedback',
    payload: {
      title: `New Feedback: ${post.title}`,
      description: post.content || '',
      url: `${baseUrl}/boards/${board_id}`,
    },
  })

  // Auto-sync to Linear if enabled
  await autoSyncToLinear({
    postId: post.id,
    orgId: board.org_id,
    title: post.title,
    content: post.content,
    authorEmail: post.author_email,
    guestEmail: post.guest_email,
  })

  return withCors(
    NextResponse.json({ success: true, post, user_source: ssoResult.source }),
    origin
  )
}
