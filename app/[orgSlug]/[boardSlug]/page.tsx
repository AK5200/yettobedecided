'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

type Org = { id: string; name: string }
type Board = { id: string; name: string }
type Post = {
  id: string
  title: string
  content: string
  status: string
  vote_count: number | null
}

export default function PublicBoardPage({
  params,
}: {
  params: Promise<{ orgSlug: string; boardSlug: string }>
}) {
  const supabase = createClient()
  const [org, setOrg] = useState<Org | null>(null)
  const [board, setBoard] = useState<Board | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [voterEmail, setVoterEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')

  const fetchPosts = async (boardId: string) => {
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('board_id', boardId)
      .eq('is_approved', true)
      .order('vote_count', { ascending: false })

    setPosts((data as Post[]) || [])
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { orgSlug, boardSlug } = await params

      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', orgSlug)
        .single()

      if (!orgData) {
        setLoading(false)
        return
      }

      const { data: boardData } = await supabase
        .from('boards')
        .select('*')
        .eq('org_id', orgData.id)
        .eq('slug', boardSlug)
        .eq('is_public', true)
        .single()

      setOrg(orgData)
      setBoard(boardData)

      if (boardData?.id) {
        await fetchPosts(boardData.id)
      }

      setLoading(false)
    }

    fetchData()
  }, [params, supabase])

  const handleVote = async (postId: string) => {
    if (!voterEmail) {
      window.alert('Please enter your email before voting.')
      return
    }

    await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, voter_email: voterEmail }),
    })

    if (board?.id) {
      await fetchPosts(board.id)
    }
  }

  const handleSubmitPost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!board?.id) return

    await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        board_id: board.id,
        title: newTitle,
        content: newContent,
        author_email: voterEmail,
      }),
    })

    setNewTitle('')
    setNewContent('')
    await fetchPosts(board.id)
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">{org?.name}</p>
        <h1 className="text-2xl font-bold">{board?.name}</h1>
      </div>

      <div className="max-w-md">
        <Input
          placeholder="Your email"
          value={voterEmail}
          onChange={(e) => setVoterEmail(e.target.value)}
        />
      </div>

      <Card className="p-4 max-w-2xl">
        <form onSubmit={handleSubmitPost} className="space-y-3">
          <Input
            placeholder="Feedback title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />
          <textarea
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            rows={4}
            placeholder="Describe your feedback"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            required
          />
          <Button type="submit">Submit Feedback</Button>
        </form>
      </Card>

      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="p-4 flex items-start gap-4">
            <Button variant="outline" onClick={() => handleVote(post.id)}>
              {post.vote_count ?? 0}
            </Button>
            <div className="flex-1">
              <div className="font-medium">{post.title}</div>
              <p className="text-sm text-muted-foreground mt-1">{post.content}</p>
            </div>
            <Badge variant="secondary">{post.status}</Badge>
          </Card>
        ))}
      </div>
    </div>
  )
}
