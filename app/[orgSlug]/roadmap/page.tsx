import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

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

  const boardIds = (publicBoards || []).map((board) => board.id)

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .in('board_id', boardIds)
    .in('status', ['planned', 'in_progress', 'shipped'])

  const planned = posts?.filter((post) => post.status === 'planned') || []
  const inProgress = posts?.filter((post) => post.status === 'in_progress') || []
  const shipped = posts?.filter((post) => post.status === 'shipped') || []

  return (
    <div className="min-h-screen p-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold">{org.name}</h1>
        <nav className="flex gap-4 text-sm">
          <Link href={`/${orgSlug}`} className="text-muted-foreground">
            Feedback
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-3">
          <h3 className="font-semibold">Planned</h3>
          {planned.map((post) => (
            <Card key={post.id} className="p-3">
              <div className="font-medium">{post.title}</div>
              <div className="text-sm text-muted-foreground">
                {post.vote_count ?? 0} votes
              </div>
            </Card>
          ))}
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold">In Progress</h3>
          {inProgress.map((post) => (
            <Card key={post.id} className="p-3">
              <div className="font-medium">{post.title}</div>
              <div className="text-sm text-muted-foreground">
                {post.vote_count ?? 0} votes
              </div>
            </Card>
          ))}
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold">Shipped</h3>
          {shipped.map((post) => (
            <Card key={post.id} className="p-3">
              <div className="font-medium">{post.title}</div>
              <div className="text-sm text-muted-foreground">
                {post.vote_count ?? 0} votes
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
