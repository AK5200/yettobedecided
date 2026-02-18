import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { BoardDetailRedesign } from '@/components/boards/board-detail-redesign'
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
      post.content?.toLowerCase().includes(search) ||
      post.author_name?.toLowerCase().includes(search) ||
      post.guest_name?.toLowerCase().includes(search) ||
      post.author_email?.toLowerCase().includes(search) ||
      post.guest_email?.toLowerCase().includes(search)
    const matchesStatus = status === 'all' || post.status === status
    const matchesTag = !tagId || postIdsWithTag.includes(post.id)
    return matchesSearch && matchesStatus && matchesTag
  }

  const sortPosts = (posts: any[]) => {
    // Always sort featured posts first, then apply the selected sort
    const sortedPosts = [...posts].sort((a, b) => {
      // Featured posts always come first
      if (a.is_pinned && !b.is_pinned) return -1
      if (!a.is_pinned && b.is_pinned) return 1

      // Then apply the selected sort
      if (sort === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
      if (sort === 'most_votes') {
        return (b.vote_count || 0) - (a.vote_count || 0)
      }
      // Default: newest first
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    return sortedPosts
  }

  const filteredPending = sortPosts((pendingPosts || []).filter(matchesFilters))
  const filteredApproved = sortPosts((approvedPosts || []).filter(matchesFilters))
  const filteredAll = sortPosts((allPosts || []).filter(matchesFilters))

  return (
    <BoardDetailRedesign
      boardId={id}
      boardName={board.name}
      boardDescription={board.description}
      orgId={board.org_id}
      pendingPosts={filteredPending}
      approvedPosts={filteredApproved}
      allPosts={filteredAll}
      adminEmail={user?.email || ''}
    />
  )
}
