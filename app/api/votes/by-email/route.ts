import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const boardId = searchParams.get('board_id')
    const voterEmail = searchParams.get('voter_email')

    if (!boardId || !voterEmail) {
      return NextResponse.json(
        { error: 'board_id and voter_email are required' },
        { status: 400 }
      )
    }

    const { data: boardPosts, error: postsError } = await supabase
      .from('posts')
      .select('id')
      .eq('board_id', boardId)

    if (postsError) {
      return NextResponse.json({ error: postsError.message }, { status: 500 })
    }

    const postIds = (boardPosts || []).map((post) => post.id)
    if (postIds.length === 0) {
      return NextResponse.json({ post_ids: [] })
    }

    const { data, error } = await supabase
      .from('votes')
      .select('post_id')
      .eq('voter_email', voterEmail)
      .in('post_id', postIds)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      post_ids: (data || []).map((row) => row.post_id),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
