import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { post_id, voter_email } = body

    if (!post_id || !voter_email) {
      return NextResponse.json({ error: 'post_id and voter_email are required' }, { status: 400 })
    }

    // Check if already voted
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('post_id', post_id)
      .eq('voter_email', voter_email)
      .single()

    if (existingVote) {
      // Remove vote (toggle off)
      const { error: deleteError } = await supabase
        .from('votes')
        .delete()
        .eq('id', existingVote.id)

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }

      // Decrement vote count
      await supabase.rpc('decrement_vote_count', { post_id_input: post_id })

      return NextResponse.json({ voted: false, message: 'Vote removed' })
    }

    // Add vote
    const { error: voteError } = await supabase
      .from('votes')
      .insert({ post_id, voter_email })

    if (voteError) {
      return NextResponse.json({ error: voteError.message }, { status: 500 })
    }

    // Increment vote count
    await supabase.rpc('increment_vote_count', { post_id_input: post_id })

    return NextResponse.json({ voted: true, message: 'Vote added' }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('post_id')
    const voterEmail = searchParams.get('voter_email')

    if (!postId) {
      return NextResponse.json({ error: 'post_id is required' }, { status: 400 })
    }

    // Get vote count
    const { data: post } = await supabase
      .from('posts')
      .select('vote_count')
      .eq('id', postId)
      .single()

    // Check if specific user voted
    let hasVoted = false
    if (voterEmail) {
      const { data: vote } = await supabase
        .from('votes')
        .select('id')
        .eq('post_id', postId)
        .eq('voter_email', voterEmail)
        .single()
      hasVoted = !!vote
    }

    return NextResponse.json({
      vote_count: post?.vote_count || 0,
      has_voted: hasVoted
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
