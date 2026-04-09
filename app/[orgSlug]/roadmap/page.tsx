import type { Metadata } from 'next'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PublicRoadmapView } from '@/components/public/public-roadmap-view'

const DEFAULT_STATUSES = [
  { key: 'open', name: 'Open', color: '#6B7280', order: 0, show_on_roadmap: true },
  { key: 'planned', name: 'Planned', color: '#3B82F6', order: 1, show_on_roadmap: true },
  { key: 'in_progress', name: 'In Progress', color: '#F59E0B', order: 2, show_on_roadmap: true },
  { key: 'shipped', name: 'Shipped', color: '#10B981', order: 3, show_on_roadmap: true },
  { key: 'closed', name: 'Closed', color: '#EF4444', order: 4, show_on_roadmap: false },
]

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
  const adminSupabase = createAdminClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', orgSlug)
    .single()

  if (!org) {
    notFound()
  }

  // Fetch statuses from DB (use admin client to bypass RLS)
  const { data: dbStatuses } = await adminSupabase
    .from('statuses')
    .select('*')
    .eq('org_id', org.id)
    .order('order', { ascending: true })

  const allStatuses = dbStatuses && dbStatuses.length > 0 ? dbStatuses : DEFAULT_STATUSES
  const roadmapStatuses = allStatuses.filter((s) => s.show_on_roadmap)
  const roadmapKeys = roadmapStatuses.map((s) => s.key)

  const { data: publicBoards } = await supabase
    .from('boards')
    .select('id')
    .eq('org_id', org.id)
    .eq('is_public', true)
    .eq('is_archived', false)

  const boardIds = (publicBoards || []).map((board) => board.id)

  if (boardIds.length === 0 || roadmapKeys.length === 0) {
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
    .in('status', roadmapKeys)

  const postIds = (posts || []).map((post) => post.id)
  const { data: comments } = postIds.length > 0
    ? await supabase.from('comments').select('post_id').in('post_id', postIds)
    : { data: [] }

  const commentCountMap = (comments || []).reduce<Record<string, number>>((acc, comment) => {
    acc[comment.post_id] = (acc[comment.post_id] || 0) + 1
    return acc
  }, {})

  // Build columns dynamically from DB statuses
  const columns = roadmapStatuses.map((status) => ({
    key: status.key,
    label: status.name,
    color: `bg-[${status.color}]/10`,
    dotColor: status.color,
    posts: (posts || []).filter((p) => p.status === status.key),
  }))

  return (
    <PublicRoadmapView
      org={org}
      orgSlug={orgSlug}
      columns={columns}
      commentCountMap={commentCountMap}
    />
  )
}
