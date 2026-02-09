import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('org_id')
  const boardId = searchParams.get('board_id')

  if (!orgId) {
    return NextResponse.json({ error: 'org_id required' }, { status: 400 })
  }

  const supabase = await createClient()

  // Get board IDs for this org
  let boardQuery = supabase.from('boards').select('id').eq('org_id', orgId)
  if (boardId) {
    boardQuery = boardQuery.eq('id', boardId)
  }
  const { data: boards } = await boardQuery
  const boardIds = boards?.map((b) => b.id) || []

  if (boardIds.length === 0) {
    return NextResponse.json({
      quick_wins: [],
      big_bets: [],
      fill_ins: [],
      time_sinks: [],
      unscored: [],
    })
  }

  let query = supabase
    .from('posts')
    .select('id, title, vote_count, effort, status, created_at')
    .in('board_id', boardIds)
    .eq('is_approved', true)
    .not('status', 'in', '("completed","closed")')

  const { data: posts } = await query

  if (!posts?.length) {
    return NextResponse.json({
      quick_wins: [],
      big_bets: [],
      fill_ins: [],
      time_sinks: [],
      unscored: [],
    })
  }

  // Calculate median vote count for "high value" threshold
  const votes = posts.map((p) => p.vote_count || 0).sort((a, b) => a - b)
  const median = votes[Math.floor(votes.length / 2)]

  // Categorize posts
  const result: {
    quick_wins: any[]
    big_bets: any[]
    fill_ins: any[]
    time_sinks: any[]
    unscored: any[]
  } = {
    quick_wins: [],
    big_bets: [],
    fill_ins: [],
    time_sinks: [],
    unscored: [],
  }

  posts.forEach((post) => {
    const isHighValue = (post.vote_count || 0) >= median
    const effort = post.effort

    if (!effort) {
      result.unscored.push(post)
    } else if (isHighValue && effort === 'low') {
      result.quick_wins.push(post)
    } else if (isHighValue && (effort === 'medium' || effort === 'high')) {
      result.big_bets.push(post)
    } else if (!isHighValue && effort === 'low') {
      result.fill_ins.push(post)
    } else {
      result.time_sinks.push(post)
    }
  })

  // Sort each by vote count
  Object.keys(result).forEach((key) => {
    result[key as keyof typeof result].sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
  })

  return NextResponse.json({
    ...result,
    median_votes: median,
  })
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const { post_id, effort } = body

  if (!post_id || !['low', 'medium', 'high', null].includes(effort)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const supabase = await createClient()

  const { error } = await supabase.from('posts').update({ effort }).eq('id', post_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
