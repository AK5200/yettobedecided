import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { fireWebhooks } from '@/lib/webhooks/fire'
import { notifyIntegrations } from '@/lib/integrations/notify'
import { triggerNewPostEmail } from '@/lib/email/triggers'
import { processIdentifiedUser } from '@/lib/sso'
import { upsertWidgetUser, incrementCounter } from '@/lib/widget-users'
import { autoSyncToLinear } from '@/lib/linear/auto-sync'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const boardId = searchParams.get('board_id')
    const search = searchParams.get('search') || searchParams.get('q')
    const exclude = searchParams.get('exclude')

    let query = supabase
      .from('posts')
      .select('*')

    if (boardId) {
      query = query.eq('board_id', boardId)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
    }

    if (exclude) {
      // Handle multiple exclude IDs separated by comma
      const excludeIds = exclude.split(',').filter(Boolean)
      for (const id of excludeIds) {
        query = query.neq('id', id.trim())
      }
    }

    // Exclude merged posts
    query = query.is('merged_into_id', null)

    const { data: posts, error } = await query
      .order('is_pinned', { ascending: false })
      .order('vote_count', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ posts })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { board_id, title, content, author_email, author_name, guest_email, guest_name, identified_user, is_guest } = body

    if (!board_id || !title) {
      return NextResponse.json({ error: 'board_id and title are required' }, { status: 400 })
    }

    // Auth check - bypass for guests
    let authenticatedUser: any = null
    if (!is_guest) {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      authenticatedUser = user
    } else {
      if (!guest_email && !identified_user) {
        return NextResponse.json({ error: 'Guest email or identified_user is required' }, { status: 400 })
      }
    }

    // Check if board exists and get require_approval setting
    const { data: board } = await supabase
      .from('boards')
      .select('id, require_approval, org_id')
      .eq('id', board_id)
      .single()

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    // Process identified user for guest posts
    type PostSsoResult = {
      user: any
      source: 'guest' | 'identified' | 'verified_jwt' | 'verified_sso'
      error?: string
    }
    let ssoResult: PostSsoResult = { user: null, source: 'guest' }
    if (is_guest && identified_user && board.org_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('sso_secret_key')
        .eq('id', board.org_id)
        .single()

      ssoResult = processIdentifiedUser(identified_user, org?.sso_secret_key || null) as PostSsoResult

      if (ssoResult.error) {
        return NextResponse.json({ error: ssoResult.error }, { status: 401 })
      }
    }

    // Use identified email/name if available, otherwise fall back to guest/author fields
    // For authenticated users, get email from auth user if not provided
    const emailToCheck = is_guest 
      ? (ssoResult.user?.email || guest_email)
      : (author_email || authenticatedUser?.email)
    const nameToUse = is_guest
      ? (ssoResult.user?.name || guest_name)
      : (author_name || authenticatedUser?.user_metadata?.name || authenticatedUser?.email?.split('@')[0])
    // Map source to UserSource type (verified_sso -> verified_jwt)
    const sourceForRow: 'guest' | 'social_google' | 'social_github' | 'identified' | 'verified_jwt' = 
      ssoResult.source === 'verified_jwt' || ssoResult.source === 'verified_sso' 
        ? 'verified_jwt' 
        : (ssoResult.source as 'guest' | 'social_google' | 'social_github' | 'identified')

    // Check if email is banned
    if (emailToCheck && board.org_id) {
      // Use admin client to bypass RLS for ban check
      const adminClient = createAdminClient()
      const { data: banned } = await adminClient
        .from('banned_emails')
        .select('id')
        .eq('org_id', board.org_id)
        .ilike('email', emailToCheck)
        .maybeSingle()

      if (banned) {
        return NextResponse.json({ error: 'This email has been banned from creating posts' }, { status: 403 })
      }
    }

    // Upsert widget_user before creating post (same logic as widget feedback route)
    let widgetUser: any = null
    if (emailToCheck && board.org_id) {
      const { user, error: userError } = await upsertWidgetUser(board.org_id, {
        external_id: ssoResult.user?.id || null,
        email: emailToCheck,
        name: nameToUse || null,
        avatar_url: ssoResult.user?.avatar || null,
        user_source: sourceForRow,
        company_id: ssoResult.user?.company?.id || null,
        company_name: ssoResult.user?.company?.name || null,
        company_plan: ssoResult.user?.company?.plan || null,
        company_monthly_spend: ssoResult.user?.company?.monthlySpend || null,
      })

      if (userError) {
        console.error('Failed to upsert widget user:', userError)
      } else {
        widgetUser = user
      }
    }

    const insertData: any = {
      board_id,
      title,
      content: content || null,
      author_email: is_guest ? null : emailToCheck,
      author_name: is_guest ? null : nameToUse,
      guest_email: is_guest ? emailToCheck : null,
      guest_name: is_guest ? (nameToUse || 'Anonymous') : null,
      identified_user_id: is_guest ? (ssoResult.user?.id || null) : null,
      identified_user_avatar: is_guest ? (ssoResult.user?.avatar || null) : null,
      user_source: is_guest ? sourceForRow : 'guest',
      is_guest: is_guest || false,
      is_approved: !board.require_approval,
      status: 'open',
      widget_user_id: widgetUser?.id || null,
    }

    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert(insertData)
      .select()
      .single()

    if (postError) {
      return NextResponse.json({ error: postError.message }, { status: 500 })
    }

    // Increment post_count for widget_user (same as widget feedback route)
    if (widgetUser?.id) {
      await incrementCounter(widgetUser.id, 'post_count')
    }

    // Fire webhook for new post
    if (board.org_id) {
      await fireWebhooks({
        orgId: board.org_id,
        event: 'post.created',
        payload: post
      })
      // Notify Slack/Discord
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
    }

    // Trigger email notification
    try {
      await triggerNewPostEmail(post.id);
    } catch (e) {
      console.error('Email trigger failed:', e);
    }

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
