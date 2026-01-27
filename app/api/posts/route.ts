import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { fireWebhooks } from '@/lib/webhooks/fire'
import { notifyIntegrations } from '@/lib/integrations/notify'
import { triggerNewPostEmail } from '@/lib/email/triggers'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const boardId = searchParams.get('board_id')
    const search = searchParams.get('search')
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
      query = query.neq('id', exclude)
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
    const { board_id, title, content, author_email, author_name, guest_email, guest_name, is_guest } = body

    if (!board_id || !title) {
      return NextResponse.json({ error: 'board_id and title are required' }, { status: 400 })
    }

    // Auth check - bypass for guests
    if (!is_guest) {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    } else {
      if (!guest_email) {
        return NextResponse.json({ error: 'Guest email is required' }, { status: 400 })
      }
    }

    // Check if board exists and get require_approval setting
    const { data: board } = await supabase
      .from('boards')
      .select('id, require_approval')
      .eq('id', board_id)
      .single()

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        board_id,
        title,
        content: content || null,
        author_email: is_guest ? null : (author_email || null),
        author_name: is_guest ? null : (author_name || null),
        guest_email: is_guest ? guest_email : null,
        guest_name: is_guest ? (guest_name || 'Anonymous') : null,
        is_guest: is_guest || false,
        is_approved: !board.require_approval,
        status: 'open'
      })
      .select()
      .single()

    if (postError) {
      return NextResponse.json({ error: postError.message }, { status: 500 })
    }

    // Fire webhook for new post
    const { data: boardData } = await supabase
      .from('boards')
      .select('org_id')
      .eq('id', board_id)
      .single()

    if (boardData?.org_id) {
      fireWebhooks({
        orgId: boardData.org_id,
        event: 'post.created',
        payload: post
      })
      // Notify Slack/Discord
      notifyIntegrations({
        orgId: boardData.org_id,
        type: 'new_feedback',
        payload: {
          title: 'New Feedback',
          description: post.title,
          url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/boards/${board_id}`,
        },
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
