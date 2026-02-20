import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { processIdentifiedUser } from '@/lib/sso'
import { incrementCounter, upsertWidgetUser } from '@/lib/widget-users'
import { handleOptions, withCors } from '@/lib/cors'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request)
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const ip = getClientIp(request)
  const { allowed } = checkRateLimit(`widget-vote:${ip}`, 30, 60)
  if (!allowed) {
    return withCors(
      NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 }),
      origin
    )
  }
  const supabase = await createClient()
  const body = await request.json()
  const { post_id, voter_email, email, guest_email, identified_user } = body

  if (!post_id) {
    return withCors(
      NextResponse.json({ error: 'post_id is required' }, { status: 400 }),
      origin
    )
  }

  // Get post and board to find org
  const { data: postData } = await supabase
    .from('posts')
    .select('board_id')
    .eq('id', post_id)
    .single()

  if (!postData?.board_id) {
    return withCors(
      NextResponse.json({ error: 'Post not found' }, { status: 404 }),
      origin
    )
  }

  const { data: boardData } = await supabase
    .from('boards')
    .select('org_id')
    .eq('id', postData.board_id)
    .single()

  if (!boardData?.org_id) {
    return withCors(
      NextResponse.json({ error: 'Board not found' }, { status: 404 }),
      origin
    )
  }

  // Get org settings
  const { data: org } = await supabase
    .from('organizations')
    .select('id, sso_secret_key')
    .eq('id', boardData.org_id)
    .single()
  if (!org?.id) {
    return withCors(
      NextResponse.json({ error: 'Organization not found' }, { status: 404 }),
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

  // Use identified email if available, otherwise fall back to voter_email
  const emailToUse = ssoResult.user?.email || voter_email || email || guest_email
  if (!emailToUse) {
    return withCors(
      NextResponse.json({ error: 'Email is required' }, { status: 400 }),
      origin
    )
  }

  const { user: widgetUser, error: userError } = await upsertWidgetUser(org.id, {
    external_id: ssoResult.user?.id,
    email: emailToUse,
    name: ssoResult.user?.name,
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

  const { data: existingVote } = await supabase
    .from('votes')
    .select('id')
    .eq('post_id', post_id)
    .eq('voter_email', emailToUse)
    .single()

  if (existingVote) {
    const { error: deleteError } = await supabase
      .from('votes')
      .delete()
      .eq('id', existingVote.id)

    if (deleteError) {
      return withCors(
        NextResponse.json({ error: deleteError.message }, { status: 500 }),
        origin
      )
    }

    await supabase.rpc('decrement_vote_count', { post_id_input: post_id })

    // Decrement widget_user vote_count
    if (widgetUser?.id) {
      const { data: user } = await supabase
        .from('widget_users')
        .select('vote_count')
        .eq('id', widgetUser.id)
        .single()
      
      if (user) {
        const currentCount = user.vote_count || 0
        await supabase
          .from('widget_users')
          .update({ vote_count: Math.max(0, currentCount - 1) })
          .eq('id', widgetUser.id)
      }
    }

    return withCors(
      NextResponse.json({ voted: false }),
      origin
    )
  }

  const voteData = {
    post_id,
    voter_email: emailToUse,
    widget_user_id: widgetUser?.id || null,
    identified_user_id: ssoResult.user?.id || null,
    identified_user_name: ssoResult.user?.name || null,
    identified_user_avatar: ssoResult.user?.avatar || null,
    user_source: sourceForRow,
  }

  const { error: insertError } = await supabase.from('votes').insert(voteData)

  if (insertError) {
    return withCors(
      NextResponse.json({ error: insertError.message }, { status: 500 }),
      origin
    )
  }

  await supabase.rpc('increment_vote_count', { post_id_input: post_id })

  if (widgetUser?.id) {
    await incrementCounter(widgetUser.id, 'vote_count')
  }

  return withCors(
    NextResponse.json({ voted: true, user_source: ssoResult.source }),
    origin
  )
}
