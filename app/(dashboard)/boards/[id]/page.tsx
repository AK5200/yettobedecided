import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { BoardDetailTabs } from '@/components/boards/board-detail-tabs'
import { BoardFilters } from '@/components/boards/board-filters'
import Link from 'next/link'

export default async function BoardDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { search?: string; status?: string; sort?: string }
}) {
  const { id } = params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: board } = await supabase
    .from('boards')
    .select('*')
    .eq('id', id)
    .single()

  if (!board) {
    notFound()
  }

  const { data: pendingPosts } = await supabase
    .from('posts')
    .select('*')
    .eq('board_id', id)
    .eq('is_approved', false)
    .order('created_at', { ascending: false })

  const { data: approvedPosts } = await supabase
    .from('posts')
    .select('*')
    .eq('board_id', id)
    .eq('is_approved', true)
    .order('is_pinned', { ascending: false })
    .order('vote_count', { ascending: false })

  const { data: allPosts } = await supabase
    .from('posts')
    .select('*')
    .eq('board_id', id)
    .order('created_at', { ascending: false })

  const search = (searchParams.search || '').toLowerCase()
  const status = searchParams.status || 'all'
  const sort = searchParams.sort || 'newest'

  const matchesFilters = (post: any) => {
    const matchesSearch =
      !search ||
      post.title?.toLowerCase().includes(search) ||
      post.content?.toLowerCase().includes(search)
    const matchesStatus = status === 'all' || post.status === status
    return matchesSearch && matchesStatus
  }

  const sortPosts = (posts: any[]) => {
    if (sort === 'oldest') {
      return [...posts].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    }
    if (sort === 'most_votes') {
      return [...posts].sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
    }
    return [...posts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  const filteredPending = sortPosts((pendingPosts || []).filter(matchesFilters))
  const filteredApproved = sortPosts((approvedPosts || []).filter(matchesFilters))
  const filteredAll = sortPosts((allPosts || []).filter(matchesFilters))

  return (
    <div className="p-8">
      <div className="mb-4">
        <Link href="/boards" className="text-sm text-muted-foreground hover:underline">
          Back to boards
        </Link>
      </div>
      <h1 className="text-2xl font-bold">{board.name}</h1>
      <p className="text-muted-foreground mt-2">
        {board.description || 'No description'}
      </p>
      <div className="mt-6">
        <BoardFilters search={searchParams.search || ''} status={status} sort={sort} />
      </div>
      <div className="mt-8">
        <BoardDetailTabs
          boardId={id}
          pendingPosts={filteredPending}
          approvedPosts={filteredApproved}
          allPosts={filteredAll}
          adminEmail={user?.email || ''}
        />
      </div>
    </div>
  )
}
