import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { fireWebhooks } from '@/lib/webhooks/fire'
import { notifyIntegrations } from '@/lib/integrations/notify'
import { triggerStatusChangeEmail } from '@/lib/email/triggers'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ post })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status, is_approved, is_pinned } = body

    // Get old post to check for status change
    const { data: oldPost } = await supabase
      .from('posts')
      .select('status, board_id')
      .eq('id', id)
      .single()

    // Build update object with only provided fields
    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    if (status !== undefined) updates.status = status
    if (is_approved !== undefined) updates.is_approved = is_approved
    if (is_pinned !== undefined) updates.is_pinned = is_pinned
    if (body.admin_note !== undefined) updates.admin_note = body.admin_note

    const { data: post, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fire webhook if status changed
    if (status !== undefined && oldPost && status !== oldPost.status) {
      const { data: boardData } = await supabase
        .from('boards')
        .select('org_id')
        .eq('id', oldPost.board_id)
        .single()

      if (boardData?.org_id) {
        await fireWebhooks({
          orgId: boardData.org_id,
          event: 'post.status_changed',
          payload: {
            ...post,
            old_status: oldPost.status,
            new_status: status
          }
        })
        // Notify Slack/Discord on status change
        const host = request.headers.get('host') || 'localhost:3000'
        const protocol = request.headers.get('x-forwarded-proto') || 'https'
        const baseUrl = `${protocol}://${host}`
        await notifyIntegrations({
          orgId: boardData.org_id,
          type: 'status_change',
          payload: {
            title: `Status Changed: ${post.title}`,
            description: `${oldPost.status} → ${status}`,
            url: `${baseUrl}/boards/${oldPost.board_id}`,
          },
        })
      }

      // Trigger email on status change
      try {
        await triggerStatusChangeEmail(id, oldPost.status, status);
      } catch (e) {
        console.error('Email trigger failed:', e);
      }
    }

    return NextResponse.json({ post })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete the post (cascades to votes and comments due to FK constraints)
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Post deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
