import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BoardsListRedesign } from '@/components/boards/boards-list-redesign'

export default async function FeedbackPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership) {
    redirect('/onboarding')
  }

  const { data: activeBoards } = await supabase
    .from('boards')
    .select('*')
    .eq('org_id', membership.org_id)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  const { data: archivedBoards } = await supabase
    .from('boards')
    .select('*')
    .eq('org_id', membership.org_id)
    .eq('is_archived', true)
    .order('created_at', { ascending: false })

  // Fetch per-board post counts and vote sums
  const allBoardIds = [...(activeBoards || []), ...(archivedBoards || [])].map(b => b.id)
  const { data: postStats } = allBoardIds.length > 0
    ? await supabase
        .from('posts')
        .select('board_id, vote_count')
        .in('board_id', allBoardIds)
        .neq('status', 'merged')
    : { data: [] }

  const boardStatsMap: Record<string, { total_posts: number; total_votes: number }> = {}
  for (const post of postStats || []) {
    if (!boardStatsMap[post.board_id]) {
      boardStatsMap[post.board_id] = { total_posts: 0, total_votes: 0 }
    }
    boardStatsMap[post.board_id].total_posts += 1
    boardStatsMap[post.board_id].total_votes += post.vote_count || 0
  }

  const activeBoardsWithStats = (activeBoards || []).map(board => ({
    ...board,
    total_posts: boardStatsMap[board.id]?.total_posts || 0,
    total_votes: boardStatsMap[board.id]?.total_votes || 0,
  }))

  const archivedBoardsWithStats = (archivedBoards || []).map(board => ({
    ...board,
    total_posts: boardStatsMap[board.id]?.total_posts || 0,
    total_votes: boardStatsMap[board.id]?.total_votes || 0,
  }))

  return (
    <BoardsListRedesign
      activeBoards={activeBoardsWithStats}
      archivedBoards={archivedBoardsWithStats}
    />
  )
}
