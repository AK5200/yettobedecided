import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default async function BoardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: board } = await supabase
    .from('boards')
    .select('*')
    .eq('id', id)
    .single()

  if (!board) {
    notFound()
  }

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('board_id', id)
    .order('vote_count', { ascending: false })

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
      {!posts || posts.length === 0 ? (
        <p className="mt-8">No feedback yet</p>
      ) : (
        <div className="space-y-4 mt-8">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="flex items-start gap-4 pt-6">
                <div className="text-center min-w-[48px]">
                  <div className="text-lg font-semibold">{post.vote_count ?? 0}</div>
                  <div className="text-xs text-muted-foreground">votes</div>
                </div>
                <div className="flex-1">
                  <div className="font-medium">{post.title}</div>
                  <p className="text-sm text-muted-foreground mt-1">{post.content}</p>
                </div>
                <Badge variant="secondary">{post.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
