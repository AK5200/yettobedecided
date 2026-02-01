import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data: { user } } = await supabase.auth.getUser()
    const body = await request.json()
    const { content, author_email } = body

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // If authenticated user (admin), use RLS-protected client
    if (user) {
      const { data: comment, error } = await supabase
        .from('comments')
        .update({ content })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ comment })
    }

    // For non-authenticated users, verify email matches
    if (!author_email) {
      return NextResponse.json({ error: 'Email required for verification' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Get the comment to verify ownership
    const { data: existingComment, error: fetchError } = await adminClient
      .from('comments')
      .select('id, author_email')
      .eq('id', id)
      .single()

    if (fetchError || !existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Verify email matches (case-insensitive)
    if (!existingComment.author_email ||
        existingComment.author_email.toLowerCase() !== author_email.toLowerCase()) {
      return NextResponse.json({ error: 'Not authorized to edit this comment' }, { status: 403 })
    }

    // Update the comment
    const { data: comment, error } = await adminClient
      .from('comments')
      .update({ content })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ comment })
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

    const { data: { user } } = await supabase.auth.getUser()

    // Try to get author_email from request body (for non-authenticated users)
    let author_email: string | undefined
    try {
      const body = await request.json()
      author_email = body.author_email
    } catch {
      // No body provided, that's okay for authenticated users
    }

    // If authenticated user (admin), use RLS-protected client
    if (user) {
      // First check if comment exists
      const { data: existing } = await supabase
        .from('comments')
        .select('id')
        .eq('id', id)
        .single()

      if (!existing) {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
      }

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Check if delete actually worked (RLS might have blocked it)
      const { data: stillExists } = await supabase
        .from('comments')
        .select('id')
        .eq('id', id)
        .single()

      if (stillExists) {
        return NextResponse.json({ error: 'Delete blocked by database policy' }, { status: 403 })
      }

      return NextResponse.json({ success: true, message: 'Comment deleted' })
    }

    // For non-authenticated users, verify email matches
    if (!author_email) {
      return NextResponse.json({ error: 'Email required for verification' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Get the comment to verify ownership
    const { data: existingComment, error: fetchError } = await adminClient
      .from('comments')
      .select('id, author_email')
      .eq('id', id)
      .single()

    if (fetchError || !existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Verify email matches (case-insensitive)
    if (!existingComment.author_email ||
        existingComment.author_email.toLowerCase() !== author_email.toLowerCase()) {
      return NextResponse.json({ error: 'Not authorized to delete this comment' }, { status: 403 })
    }

    // Delete the comment
    const { error } = await adminClient
      .from('comments')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Comment deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
