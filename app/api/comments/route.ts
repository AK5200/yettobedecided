import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { fireWebhooks } from '@/lib/webhooks/fire'
import { notifyIntegrations } from '@/lib/integrations/notify'
import { triggerNewCommentEmail } from '@/lib/email/triggers'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('post_id')

    if (!postId) {
      return NextResponse.json({ error: 'post_id is required' }, { status: 400 })
    }

    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ comments })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { post_id, content, author_email, author_name, is_from_admin, is_internal = false } = body

    if (!post_id || !content) {
      return NextResponse.json({ error: 'post_id and content are required' }, { status: 400 })
    }

    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        post_id,
        content,
        author_email: author_email || null,
        author_name: author_name || null,
        is_from_admin: is_from_admin || false,
        is_internal
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fire webhook for new comment
    const { data: postData } = await supabase
      .from('posts')
      .select('title, board_id')
      .eq('id', post_id)
      .single()

    if (postData?.board_id) {
      const { data: boardData } = await supabase
        .from('boards')
        .select('org_id')
        .eq('id', postData.board_id)
        .single()

      if (boardData?.org_id) {
        fireWebhooks({
          orgId: boardData.org_id,
          event: 'comment.created',
          payload: {
            comment: comment,
            post_id: post_id,
            post_title: postData.title
          }
        })
        // Notify Slack/Discord on new comment
        notifyIntegrations({
          orgId: boardData.org_id,
          type: 'new_comment',
          payload: {
            title: 'New Comment',
            description: `Comment on: ${postData.title}`,
            url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}`,
          },
        })
      }
    }

    // Trigger email notification (only for public comments)
    if (!body.is_internal) {
      try {
        await triggerNewCommentEmail(post_id, content);
      } catch (e) {
        console.error('Email trigger failed:', e);
      }
    }

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
