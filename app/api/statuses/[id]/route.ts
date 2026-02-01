import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single()

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get the status to verify ownership
    const { data: status, error: fetchError } = await supabase
      .from('statuses')
      .select('*')
      .eq('id', id)
      .eq('org_id', membership.org_id)
      .single()

    if (fetchError || !status) {
      return NextResponse.json({ error: 'Status not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, color, show_on_roadmap, order } = body

    const updates: Record<string, any> = {}
    if (name !== undefined) updates.name = name.trim()
    if (color !== undefined) updates.color = color
    if (show_on_roadmap !== undefined) updates.show_on_roadmap = show_on_roadmap
    if (order !== undefined) updates.order = order

    const { data: updatedStatus, error } = await supabase
      .from('statuses')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating status:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ status: updatedStatus })
  } catch (error) {
    console.error('Error in PATCH /api/statuses/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single()

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get the status to verify ownership
    const { data: status, error: fetchError } = await supabase
      .from('statuses')
      .select('*')
      .eq('id', id)
      .eq('org_id', membership.org_id)
      .single()

    if (fetchError || !status) {
      return NextResponse.json({ error: 'Status not found' }, { status: 404 })
    }

    // Check if any posts are using this status
    const { count } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', status.key)

    // Parse request body for reassignment
    let reassignTo: string | null = null
    try {
      const body = await request.json()
      reassignTo = body.reassignTo
    } catch {
      // No body provided, that's fine
    }

    if (count && count > 0) {
      if (!reassignTo) {
        // Return info about posts that need reassignment
        return NextResponse.json({
          error: 'Posts need reassignment',
          requiresReassignment: true,
          postCount: count,
          statusKey: status.key,
        }, { status: 400 })
      }

      // Verify the target status exists
      const { data: targetStatus } = await supabase
        .from('statuses')
        .select('key')
        .eq('org_id', membership.org_id)
        .eq('key', reassignTo)
        .single()

      if (!targetStatus) {
        return NextResponse.json({ error: 'Target status not found' }, { status: 400 })
      }

      // Reassign all posts to the new status
      const { error: reassignError } = await supabase
        .from('posts')
        .update({ status: reassignTo })
        .eq('status', status.key)

      if (reassignError) {
        console.error('Error reassigning posts:', reassignError)
        return NextResponse.json({ error: 'Failed to reassign posts' }, { status: 500 })
      }
    }

    // Delete the status
    const { error } = await supabase
      .from('statuses')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting status:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, reassignedCount: count || 0 })
  } catch (error) {
    console.error('Error in DELETE /api/statuses/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
