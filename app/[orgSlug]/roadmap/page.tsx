import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { PostDetailDialog } from '@/components/boards/post-detail-dialog'

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
      <div className="min-h-screen p-8">
        <header className="flex flex-col md:flex-row md:items-center md:justify-center gap-4 mb-8">
          <nav className="flex gap-4 text-sm">
            <Link href={`/${orgSlug}/features`} className="text-muted-foreground">
              Features
            </Link>
            <Link href={`/${orgSlug}/roadmap`} className="font-medium">
              Roadmap
            </Link>
            <Link href={`/${orgSlug}/changelog`} className="text-muted-foreground">
              Changelog
            </Link>
          </nav>
        </header>
        <h2 className="text-xl font-semibold mb-6">Roadmap</h2>
        <div className="text-center py-12 text-muted-foreground">
          <p>No public boards available.</p>
        </div>
      </div>
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

  return (
    <div className="min-h-screen p-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-center gap-4 mb-8">
        <nav className="flex gap-4 text-sm">
          <Link href={`/${orgSlug}/features`} className="text-muted-foreground">
            Features
          </Link>
          <Link href={`/${orgSlug}/roadmap`} className="font-medium">
            Roadmap
          </Link>
          <Link href={`/${orgSlug}/changelog`} className="text-muted-foreground">
            Changelog
          </Link>
        </nav>
      </header>
      <h2 className="text-xl font-semibold mb-6">Roadmap</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-3">
          <h3 className="font-semibold">Planned</h3>
          {planned.map((post) => (
            <PostDetailDialog key={post.id} post={post}>
              <Card className="p-3 cursor-pointer">
                <div className="font-medium">{post.title}</div>
                <div className="text-sm text-muted-foreground">
                  {post.vote_count ?? 0} votes • {commentCountMap[post.id] || 0} comments
                </div>
              </Card>
            </PostDetailDialog>
          ))}
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold">In Progress</h3>
          {inProgress.map((post) => (
            <PostDetailDialog key={post.id} post={post}>
              <Card className="p-3 cursor-pointer">
                <div className="font-medium">{post.title}</div>
                <div className="text-sm text-muted-foreground">
                  {post.vote_count ?? 0} votes • {commentCountMap[post.id] || 0} comments
                </div>
              </Card>
            </PostDetailDialog>
          ))}
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold">Next</h3>
          {nextUp.map((post) => (
            <PostDetailDialog key={post.id} post={post}>
              <Card className="p-3 cursor-pointer">
                <div className="font-medium">{post.title}</div>
                <div className="text-sm text-muted-foreground">
                  {post.vote_count ?? 0} votes • {commentCountMap[post.id] || 0} comments
                </div>
              </Card>
            </PostDetailDialog>
          ))}
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold">Completed</h3>
          {completed.map((post) => (
            <PostDetailDialog key={post.id} post={post}>
              <Card className="p-3 cursor-pointer">
                <div className="font-medium">{post.title}</div>
                <div className="text-sm text-muted-foreground">
                  {post.vote_count ?? 0} votes • {commentCountMap[post.id] || 0} comments
                </div>
              </Card>
            </PostDetailDialog>
          ))}
        </div>
      </div>
    </div>
  )
}
