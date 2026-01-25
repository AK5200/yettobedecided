import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { BoardDetailTabs } from '@/components/boards/board-detail-tabs'
import Link from 'next/link'

export default async function BoardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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
      <div className="mt-8">
        <BoardDetailTabs
          boardId={id}
          pendingPosts={pendingPosts || []}
          approvedPosts={approvedPosts || []}
          allPosts={allPosts || []}
          adminEmail={user?.email || ''}
        />
      </div>
    </div>
  )
}
