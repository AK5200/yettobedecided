import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

    // Delete all comments for this post
    const { error: commentsError } = await supabase
      .from('comments')
      .delete()
      .eq('post_id', id)

    if (commentsError) {
      return NextResponse.json({ error: commentsError.message }, { status: 500 })
    }

    // Delete all votes for this post
    const { error: votesError } = await supabase
      .from('votes')
      .delete()
      .eq('post_id', id)

    if (votesError) {
      return NextResponse.json({ error: votesError.message }, { status: 500 })
    }

    // Reset vote count to 0
    const { error: updateError } = await supabase
      .from('posts')
      .update({ vote_count: 0 })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Post reset (comments and votes cleared)' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
