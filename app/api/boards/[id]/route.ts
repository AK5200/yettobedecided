import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data: board, error } = await supabase
      .from('boards')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    return NextResponse.json({ board })
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

    // Get board to verify ownership
    const { data: board, error: boardFetchError } = await supabase
      .from('boards')
      .select('org_id, slug')
      .eq('id', id)
      .single()

    if (boardFetchError || !board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    // Verify user is member of org
    const { data: membership } = await supabase
      .from('org_members')
      .select('id')
      .eq('org_id', board.org_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { name, slug, description, is_public, is_archived, allow_comments, allow_voting, require_approval } = body

    // Build update object with only provided fields
    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    if (name !== undefined) updates.name = name
    if (slug !== undefined) updates.slug = slug
    if (description !== undefined) updates.description = description
    if (is_public !== undefined) updates.is_public = is_public
    if (is_archived !== undefined) updates.is_archived = is_archived
    if (allow_comments !== undefined) updates.allow_comments = allow_comments
    if (allow_voting !== undefined) updates.allow_voting = allow_voting
    if (require_approval !== undefined) updates.require_approval = require_approval

    // If slug is being updated, check if it's unique within org
    if (slug !== undefined && slug !== board.slug) {
      const { data: existing } = await supabase
        .from('boards')
        .select('id')
        .eq('org_id', board.org_id)
        .eq('slug', slug)
        .neq('id', id)
        .single()

      if (existing) {
        return NextResponse.json({ error: 'Board slug already exists in this organization' }, { status: 400 })
      }
    }

    const { data: updatedBoard, error: updateError } = await supabase
      .from('boards')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ board: updatedBoard })
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

    // Get board to verify ownership
    const { data: board, error: boardFetchError } = await supabase
      .from('boards')
      .select('org_id')
      .eq('id', id)
      .single()

    if (boardFetchError || !board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    // Verify user is member of org
    const { data: membership } = await supabase
      .from('org_members')
      .select('id')
      .eq('org_id', board.org_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { error } = await supabase
      .from('boards')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
