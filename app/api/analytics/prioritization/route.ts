import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const VALID_CATEGORIES = ['quick_wins', 'big_bets', 'fill_ins', 'time_sinks', 'drop']

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('org_id')
  const boardId = searchParams.get('board_id')

  if (!orgId) {
    return NextResponse.json({ error: 'org_id required' }, { status: 400 })
  }

  const supabase = await createClient()

  let boardQuery = supabase.from('boards').select('id').eq('org_id', orgId)
  if (boardId) {
    boardQuery = boardQuery.eq('id', boardId)
  }
  const { data: boards } = await boardQuery
  const boardIds = boards?.map((b) => b.id) || []

  const emptyResult = {
    quick_wins: [],
    big_bets: [],
    fill_ins: [],
    time_sinks: [],
    drop: [],
    unscored: [],
  }

  if (boardIds.length === 0) {
    return NextResponse.json(emptyResult)
  }

  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, content, vote_count, priority_category, status, created_at')
    .in('board_id', boardIds)
    .not('status', 'in', '("shipped","closed")')

  if (!posts?.length) {
    return NextResponse.json(emptyResult)
  }

  const result: Record<string, any[]> = {
    quick_wins: [],
    big_bets: [],
    fill_ins: [],
    time_sinks: [],
    drop: [],
    unscored: [],
  }

  posts.forEach((post) => {
    const category = post.priority_category
    if (category && VALID_CATEGORIES.includes(category)) {
      result[category].push(post)
    } else {
      result.unscored.push(post)
    }
  })

  // Sort each category by vote count descending
  Object.keys(result).forEach((key) => {
    result[key].sort((a: any, b: any) => (b.vote_count || 0) - (a.vote_count || 0))
  })

  return NextResponse.json(result)
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const { post_id, priority_category } = body

  if (!post_id) {
    return NextResponse.json({ error: 'post_id required' }, { status: 400 })
  }

  if (priority_category !== null && !VALID_CATEGORIES.includes(priority_category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('posts')
    .update({ priority_category })
    .eq('id', post_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
