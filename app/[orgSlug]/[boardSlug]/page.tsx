'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CommentList } from '@/components/boards/comment-list'
import { CommentForm } from '@/components/boards/comment-form'
import { Separator } from '@/components/ui/separator'

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
  const [authorName, setAuthorName] = useState('')
  const [authorEmail, setAuthorEmail] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [commentRefresh, setCommentRefresh] = useState(0)

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
    if (!newTitle.trim()) return
    setSubmitLoading(true)

    await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        board_id: board.id,
        title: newTitle,
        content: newContent,
        author_name: authorName,
        author_email: authorEmail,
      }),
    })

    setNewTitle('')
    setNewContent('')
    setAuthorName('')
    setAuthorEmail('')
    await fetchPosts(board.id)
    setSubmitLoading(false)
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

      <div className="border p-4 rounded mb-8 max-w-2xl">
        <h3 className="font-semibold mb-4">Submit Feedback</h3>
        <form onSubmit={handleSubmitPost} className="space-y-3">
          <Input
            placeholder="Your name (optional)"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
          />
          <Input
            placeholder="Your email (optional)"
            value={authorEmail}
            onChange={(e) => setAuthorEmail(e.target.value)}
          />
          <Input
            placeholder="Feedback title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />
          <Textarea
            placeholder="Describe your feedback..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
          />
          <Button type="submit" disabled={submitLoading || !newTitle.trim()}>
            {submitLoading ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </form>
      </div>

      <div className="max-w-md">
        <Input
          placeholder="Your email"
          value={voterEmail}
          onChange={(e) => setVoterEmail(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <Dialog key={post.id}>
            <DialogTrigger asChild>
              <Card className="p-4 flex items-start gap-4 cursor-pointer">
                <Button variant="outline" onClick={() => handleVote(post.id)}>
                  {post.vote_count ?? 0}
                </Button>
                <div className="flex-1">
                  <div className="font-medium">{post.title}</div>
                  <p className="text-sm text-muted-foreground mt-1">{post.content}</p>
                </div>
                <Badge variant="secondary">{post.status}</Badge>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{post.title}</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-gray-600">{post.content}</p>
              <p className="text-sm text-gray-500">
                By {authorName || 'Anonymous'} • {post.vote_count ?? 0} votes
              </p>
              <Separator className="my-4" />
              <h3 className="font-semibold">Comments</h3>
              <CommentList postId={post.id} refreshTrigger={commentRefresh} />
              <Separator className="my-4" />
              <CommentForm
                postId={post.id}
                authorEmail={authorEmail}
                authorName={authorName}
                onCommentAdded={() => setCommentRefresh((prev) => prev + 1)}
              />
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  )
}
