import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PublicFeaturesView } from '@/components/public/public-features-view'

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
    title: `${name} - Feature Requests`,
    description: `Browse and vote on feature requests for ${name}.`,
  }
}

export default async function PublicFeaturesPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<{ board?: string; status?: string; q?: string }>
}) {
  const { orgSlug } = await params
  const resolvedSearchParams = await searchParams
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', orgSlug)
    .single()

  if (!org) {
    notFound()
  }

  // Get all public boards
  const { data: boards } = await supabase
    .from('boards')
    .select('*')
    .eq('org_id', org.id)
    .eq('is_public', true)
    .eq('is_archived', false)
    .order('name', { ascending: true })

  const boardIds = (boards || []).map((board) => board.id)

  // Get all approved posts from public boards
  let postsQuery = supabase
    .from('posts')
    .select('*, boards(id, name, slug)')
    .in('board_id', boardIds)
    .eq('is_approved', true)
    .is('merged_into_id', null)

  // Filter by board if specified
  if (resolvedSearchParams.board) {
    const board = boards?.find((b) => b.slug === resolvedSearchParams.board)
    if (board) {
      postsQuery = postsQuery.eq('board_id', board.id)
    }
  }

  // Filter by status if specified
  if (resolvedSearchParams.status && resolvedSearchParams.status !== 'all') {
    postsQuery = postsQuery.eq('status', resolvedSearchParams.status)
  }

  // Search filter
  if (resolvedSearchParams.q) {
    const searchTerm = resolvedSearchParams.q.toLowerCase()
    postsQuery = postsQuery.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
  }

  const { data: posts } = await postsQuery
    .order('is_pinned', { ascending: false })
    .order('vote_count', { ascending: false })
    .order('created_at', { ascending: false })

  // Get post tags
  const postIds = (posts || []).map((post) => post.id)
  const { data: postTags } = await supabase
    .from('post_tags')
    .select('post_id, tags(id, name, color)')
    .in('post_id', postIds)

  const tagsByPostId = (postTags || []).reduce<Record<string, any[]>>((acc, pt) => {
    if (!acc[pt.post_id]) {
      acc[pt.post_id] = []
    }
    if (pt.tags) {
      acc[pt.post_id].push(pt.tags)
    }
    return acc
  }, {})

  // Get changelog entries
  const { data: changelogEntries } = await supabase
    .from('changelog_entries')
    .select('*')
    .eq('org_id', org.id)
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(5)

  return (
    <PublicFeaturesView
      org={org}
      orgSlug={orgSlug}
      boards={boards || []}
      posts={posts || []}
      tagsByPostId={tagsByPostId}
      changelogEntries={changelogEntries || []}
      currentBoard={resolvedSearchParams.board}
      currentStatus={resolvedSearchParams.status || 'all'}
      searchQuery={resolvedSearchParams.q || ''}
    />
  )
}
