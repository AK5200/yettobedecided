import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { BoardDetailTabs } from '@/components/boards/board-detail-tabs'
import { BoardFilters } from '@/components/boards/board-filters'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Settings, Plus } from 'lucide-react'

export default async function BoardDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ q?: string; status?: string; sort?: string; tag?: string }>
}) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const { id } = resolvedParams
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

  if (board.is_archived) {
    return (
      <div className="p-8">
        <div className="text-sm text-gray-500 mb-4">
          <Link href="/boards" className="hover:underline">Boards</Link>
          <span className="mx-2">/</span>
          <span>{board.name}</span>
        </div>
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-md">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">
            This board is archived
          </h2>
          <p className="text-yellow-700 mb-4">
            This board has been archived and is no longer active. You can unarchive it from the board settings.
          </p>
          <Link href={`/boards/${board.id}/settings`}>
            <Button variant="outline">Go to Settings</Button>
          </Link>
        </div>
      </div>
    )
  }

  const { data: pendingPosts } = await supabase
    .from('posts')
    .select('*')
    .eq('board_id', id)
    .eq('is_approved', false)
    .neq('status', 'merged')
    .order('created_at', { ascending: false })

  const { data: approvedPosts } = await supabase
    .from('posts')
    .select('*')
    .eq('board_id', id)
    .eq('is_approved', true)
    .neq('status', 'merged')
    .order('is_pinned', { ascending: false })
    .order('vote_count', { ascending: false })

  const { data: allPosts } = await supabase
    .from('posts')
    .select('*')
    .eq('board_id', id)
    .neq('status', 'merged')
    .order('created_at', { ascending: false })

  const search = (resolvedSearchParams.q || '').toLowerCase()
  const status = resolvedSearchParams.status || 'all'
  const sort = resolvedSearchParams.sort || 'newest'
  const tagId = resolvedSearchParams.tag

  // Fetch post tags if tag filter is active
  let postIdsWithTag: string[] = []
  if (tagId) {
    const { data: postTags } = await supabase
      .from('post_tags')
      .select('post_id')
      .eq('tag_id', tagId)
    postIdsWithTag = postTags?.map(pt => pt.post_id) || []
  }

  const matchesFilters = (post: any) => {
    const matchesSearch =
      !search ||
      post.title?.toLowerCase().includes(search) ||
      post.content?.toLowerCase().includes(search)
    const matchesStatus = status === 'all' || post.status === status
    const matchesTag = !tagId || postIdsWithTag.includes(post.id)
    return matchesSearch && matchesStatus && matchesTag
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
      <div className="text-sm text-gray-500 mb-4">
        <Link href="/boards" className="hover:underline">Boards</Link>
        <span className="mx-2">/</span>
        <span>{board.name}</span>
      </div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{board.name}</h1>
        <div className="flex gap-2">
          <Link href={`/boards/${board.id}/new-post`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          </Link>
          <Link href={`/boards/${board.id}/settings`}>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>
      </div>
      <p className="text-muted-foreground mt-2">
        {board.description || 'No description'}
      </p>
      <div className="mt-6">
        <BoardFilters
          search={resolvedSearchParams.q || ''}
          status={status}
          sort={sort}
          orgId={board.org_id}
        />
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
