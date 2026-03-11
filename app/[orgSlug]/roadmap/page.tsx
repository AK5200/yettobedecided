import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PublicRoadmapView } from '@/components/public/public-roadmap-view'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}): Promise<Metadata> {
  const { orgSlug } = await params
  const supabase = await createClient()
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('slug', orgSlug)
    .single()

  const name = org?.name || orgSlug
  return {
    title: `${name} - Roadmap`,
    description: `See what's planned, in progress, and completed for ${name}.`,
  }
}

export default async function PublicRoadmapPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', orgSlug)
    .single()

  if (!org) {
    notFound()
  }

  const { data: publicBoards } = await supabase
    .from('boards')
    .select('id')
    .eq('org_id', org.id)
    .eq('is_public', true)
    .eq('is_archived', false)

  const boardIds = (publicBoards || []).map((board) => board.id)

  if (boardIds.length === 0) {
    return (
      <PublicRoadmapView
        org={org}
        orgSlug={orgSlug}
        columns={[]}
        commentCountMap={{}}
      />
    )
  }

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .in('board_id', boardIds)
    .eq('is_approved', true)
    .is('merged_into_id', null)
    .in('status', ['open', 'planned', 'in_progress', 'shipped', 'closed'])

  const planned = posts?.filter((post) => post.status === 'planned') || []
  const inProgress = posts?.filter((post) => post.status === 'in_progress') || []
  const nextUp = posts?.filter((post) => post.status === 'open') || []
  const completed =
    posts?.filter((post) => post.status === 'shipped' || post.status === 'closed') || []

  const postIds = (posts || []).map((post) => post.id)
  const { data: comments } = await supabase
    .from('comments')
    .select('post_id')
    .in('post_id', postIds)

  const commentCountMap = (comments || []).reduce<Record<string, number>>((acc, comment) => {
    acc[comment.post_id] = (acc[comment.post_id] || 0) + 1
    return acc
  }, {})

  const columns = [
    { key: 'planned', label: 'Planned', color: 'bg-violet-50', dotColor: '#8B5CF6', posts: planned },
    { key: 'in_progress', label: 'In Progress', color: 'bg-amber-50', dotColor: '#F59E0B', posts: inProgress },
    { key: 'next', label: 'Under Review', color: 'bg-blue-50', dotColor: '#3B82F6', posts: nextUp },
    { key: 'completed', label: 'Complete', color: 'bg-emerald-50', dotColor: '#10B981', posts: completed },
  ]

  return (
    <PublicRoadmapView
      org={org}
      orgSlug={orgSlug}
      columns={columns}
      commentCountMap={commentCountMap}
    />
  )
}
