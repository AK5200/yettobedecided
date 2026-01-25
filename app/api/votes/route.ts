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

    // Check if already voted (count in case of duplicates)
    const { count: existingCount, error: existingError } = await supabase
      .from('votes')
      .select('id', { count: 'exact' })
      .eq('post_id', post_id)
      .eq('voter_email', voter_email)

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 })
    }

    if (existingCount && existingCount > 0) {
      // Remove all votes for this post/email (toggle off)
      const { data: deletedVotes, error: deleteError } = await supabase
        .from('votes')
        .delete()
        .eq('post_id', post_id)
        .eq('voter_email', voter_email)
        .select('id')

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }

      const deleteCount = deletedVotes?.length ?? existingCount
      const { error: adjustError } = await supabase.rpc('adjust_vote_count', {
        post_id_input: post_id,
        delta_input: -deleteCount,
      })

      if (adjustError) {
        const { data: post } = await supabase
          .from('posts')
          .select('vote_count')
          .eq('id', post_id)
          .single()
        const { error: updateError } = await supabase
          .from('posts')
          .update({
            vote_count: Math.max(0, (post?.vote_count ?? 0) - deleteCount),
          })
          .eq('id', post_id)
        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 })
        }
      }

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
    const { error: incrementError } = await supabase.rpc('adjust_vote_count', {
      post_id_input: post_id,
      delta_input: 1,
    })

    if (incrementError) {
      const { data: post } = await supabase
        .from('posts')
        .select('vote_count')
        .eq('id', post_id)
        .single()
      const { error: updateError } = await supabase
        .from('posts')
        .update({
          vote_count: (post?.vote_count ?? 0) + 1,
        })
        .eq('id', post_id)
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    }

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
