import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { fireWebhooks } from '@/lib/webhooks/fire'
import { notifyIntegrations } from '@/lib/integrations/notify'
import { triggerNewCommentEmail } from '@/lib/email/triggers'
import { processIdentifiedUser } from '@/lib/sso'
import { incrementCounter, upsertWidgetUser } from '@/lib/widget-users'
import { handleOptions, withCors } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request)
}

export async function GET(request: Request) {
  const origin = request.headers.get('origin')
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('post_id')

    if (!postId) {
      return withCors(NextResponse.json({ error: 'post_id is required' }, { status: 400 }), origin)
    }

    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (error) {
      return withCors(NextResponse.json({ error: error.message }, { status: 500 }), origin)
    }

    return withCors(NextResponse.json({ comments }), origin)
  } catch (error) {
    return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }), origin)
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { post_id, content, author_email, author_name, guest_email, guest_name, identified_user, is_from_admin, is_internal = false } = body

    if (!post_id || !content) {
      return withCors(NextResponse.json({ error: 'post_id and content are required' }, { status: 400 }), origin)
    }

    // Get post and board to find org
    const { data: postData } = await supabase
      .from('posts')
      .select('board_id')
      .eq('id', post_id)
      .single()

    if (!postData?.board_id) {
      return withCors(NextResponse.json({ error: 'Post not found' }, { status: 404 }), origin)
    }

    const { data: boardData } = await supabase
      .from('boards')
      .select('org_id')
      .eq('id', postData.board_id)
      .single()

    if (!boardData?.org_id) {
      return withCors(NextResponse.json({ error: 'Board not found' }, { status: 404 }), origin)
    }

    // Get org settings
    const { data: org } = await supabase
      .from('organizations')
      .select('id, guest_posting_enabled, sso_secret_key')
      .eq('id', boardData.org_id)
      .single()
    if (!org?.id) {
      return withCors(NextResponse.json({ error: 'Organization not found' }, { status: 404 }), origin)
    }

    // Process identified user
    const ssoResult = processIdentifiedUser(identified_user, org?.sso_secret_key || null)
    if (ssoResult.error) {
      return withCors(NextResponse.json({ error: ssoResult.error }, { status: 401 }), origin)
    }
    const sourceForRow = ssoResult.source === 'verified_jwt' ? 'verified_sso' : ssoResult.source

    // Use identified email/name if available, otherwise fall back to guest/author fields
    const emailToUse = ssoResult.user?.email || guest_email || author_email
    const nameToUse = ssoResult.user?.name || guest_name || author_name

    if (!emailToUse && !is_from_admin && !org?.guest_posting_enabled) {
      return withCors(NextResponse.json({ error: 'Guest posting is disabled' }, { status: 403 }), origin)
    }

    // Require email for non-admin comments
    if (!is_from_admin && !emailToUse) {
      return withCors(NextResponse.json({ error: 'author_email is required' }, { status: 400 }), origin)
    }

    let widgetUserId: string | null = null
    if (!is_from_admin && emailToUse) {
      const { user: widgetUser, error: userError } = await upsertWidgetUser(org.id, {
        external_id: ssoResult.user?.id,
        email: emailToUse,
        name: nameToUse,
        avatar_url: ssoResult.user?.avatar,
        user_source: ssoResult.source,
        company_id: ssoResult.user?.company?.id,
        company_name: ssoResult.user?.company?.name,
        company_plan: ssoResult.user?.company?.plan,
        company_monthly_spend: ssoResult.user?.company?.monthlySpend,
      })

      if (userError) {
        return withCors(NextResponse.json({ error: userError }, { status: 500 }), origin)
      }

      if (widgetUser?.is_banned) {
        return withCors(NextResponse.json({ error: 'User is banned' }, { status: 403 }), origin)
      }

      widgetUserId = widgetUser?.id || null
    }

    const commentData = {
      post_id,
      content,
      author_email: emailToUse || null,
      author_name: nameToUse || null,
      widget_user_id: widgetUserId,
      identified_user_id: ssoResult.user?.id || null,
      identified_user_avatar: ssoResult.user?.avatar || null,
      user_source: sourceForRow,
      is_from_admin: is_from_admin || false,
      is_internal
    }

    const { data: comment, error } = await supabase
      .from('comments')
      .insert(commentData)
      .select()
      .single()

    if (error) {
      return withCors(NextResponse.json({ error: error.message }, { status: 500 }), origin)
    }

    // Fire webhook for new comment
    const { data: postDataForWebhook } = await supabase
      .from('posts')
      .select('title, board_id')
      .eq('id', post_id)
      .single()

    if (postDataForWebhook?.board_id) {
      const { data: boardDataForWebhook } = await supabase
        .from('boards')
        .select('org_id')
        .eq('id', postDataForWebhook.board_id)
        .single()

      if (boardDataForWebhook?.org_id) {
        await fireWebhooks({
          orgId: boardDataForWebhook.org_id,
          event: 'comment.created',
          payload: {
            comment: comment,
            post_id: post_id,
            post_title: postDataForWebhook.title
          }
        })
        // Notify Slack/Discord on new comment
        const host = request.headers.get('host') || 'localhost:3000'
        const protocol = request.headers.get('x-forwarded-proto') || 'https'
        const baseUrl = `${protocol}://${host}`
        await notifyIntegrations({
          orgId: boardDataForWebhook.org_id,
          type: 'new_comment',
          payload: {
            title: `New Comment: ${postDataForWebhook.title}`,
            description: comment.content || '',
            url: `${baseUrl}/boards/${postDataForWebhook.board_id}`,
          },
        })
      }
    }

    if (widgetUserId) {
      await incrementCounter(widgetUserId, 'comment_count')
    }

    // Trigger email notification (only for public comments)
    if (!body.is_internal) {
      try {
        await triggerNewCommentEmail(post_id, content);
      } catch (e) {
        console.error('Email trigger failed:', e);
      }
    }

    return withCors(NextResponse.json({ comment }, { status: 201 }), origin)
  } catch (error) {
    return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }), origin)
  }
}
