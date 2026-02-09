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
    .select('id, title, vote_count, effort, time, status, created_at')
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
    const time = post.time

    // Unscored if missing either effort or time
    if (!effort || !time) {
      result.unscored.push(post)
      return
    }

    // Determine if high effort/time (medium or high effort, or mid/high time)
    const isHighEffort = effort === 'medium' || effort === 'high'
    const isHighTime = time === 'mid' || time === 'high'
    const isHighEffortOrTime = isHighEffort || isHighTime

    // Quick Wins: High value, Low effort, Low time
    if (isHighValue && effort === 'low' && time === 'easy') {
      result.quick_wins.push(post)
    }
    // Big Bets: High value, High effort OR High time
    else if (isHighValue && isHighEffortOrTime) {
      result.big_bets.push(post)
    }
    // Fill-ins: Low value, Low effort, Low time
    else if (!isHighValue && effort === 'low' && time === 'easy') {
      result.fill_ins.push(post)
    }
    // Time Sinks: Low value, High effort OR High time
    else if (!isHighValue && isHighEffortOrTime) {
      result.time_sinks.push(post)
    }
    // Default to unscored if doesn't fit any category
    else {
      result.unscored.push(post)
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
  const { post_id, effort, time } = body

  if (!post_id) {
    return NextResponse.json({ error: 'post_id required' }, { status: 400 })
  }

  // Validate effort if provided
  if (effort !== undefined && !['low', 'medium', 'high', null].includes(effort)) {
    return NextResponse.json({ error: 'Invalid effort value' }, { status: 400 })
  }

  // Validate time if provided
  if (time !== undefined && !['easy', 'mid', 'high', null].includes(time)) {
    return NextResponse.json({ error: 'Invalid time value' }, { status: 400 })
  }

  const supabase = await createClient()

  // Build update object
  const updateData: any = {}
  if (effort !== undefined) {
    updateData.effort = effort
  }
  if (time !== undefined) {
    updateData.time = time
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'effort or time required' }, { status: 400 })
  }

  const { error } = await supabase.from('posts').update(updateData).eq('id', post_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
