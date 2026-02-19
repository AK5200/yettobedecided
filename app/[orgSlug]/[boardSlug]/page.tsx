'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
import { toast } from 'sonner'

type Org = { id: string; name: string }
type Board = { id: string; name: string }
type Post = {
  id: string
  title: string
  content: string
  status: string
  vote_count: number | null
  created_at: string
  guest_name: string | null
  author_name: string | null
  is_guest: boolean
  is_pinned: boolean
  widget_users?: {
    avatar_url: string | null
    name: string | null
    email: string | null
    user_source: string | null
    company_name: string | null
  } | null
}

function formatDate(dateString?: string | null): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function PublicBoardPage({
  params,
}: {
  params: Promise<{ orgSlug: string; boardSlug: string }>
}) {
  const supabase = useMemo(() => createClient(), [])
  const [org, setOrg] = useState<Org | null>(null)
  const [board, setBoard] = useState<Board | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  // Shared user identity for all actions
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [commentRefresh, setCommentRefresh] = useState(0)
  const [votingIds, setVotingIds] = useState<string[]>([])
  const [votedPostIds, setVotedPostIds] = useState<string[]>([])

  const fetchPosts = async (boardId: string) => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, widget_users(avatar_url, name, email, user_source, company_name)')
      .eq('board_id', boardId)
      .eq('is_approved', true)
      .neq('status', 'merged')
      .order('is_pinned', { ascending: false })
      .order('vote_count', { ascending: false })

    setPosts((data as Post[]) || [])
  }

  const fetchVoteStatuses = async (email: string, boardId?: string) => {
    if (!email || !boardId) {
      setVotedPostIds([])
      return
    }

    const response = await fetch(
      `/api/votes/by-email?board_id=${boardId}&voter_email=${encodeURIComponent(email)}`
    )
    if (!response.ok) {
      setVotedPostIds([])
      return
    }
    const data = await response.json()
    setVotedPostIds(data?.post_ids || [])
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
        .eq('is_archived', false)
        .single()

      setOrg(orgData)
      setBoard(boardData)

      if (boardData?.id) {
        await fetchPosts(boardData.id)
      }

      setLoading(false)
    }

    fetchData()
  }, [params])

  useEffect(() => {
    if (!userEmail) {
      setVotedPostIds([])
      return
    }
    fetchVoteStatuses(userEmail, board?.id)
  }, [userEmail, board?.id])

  const handleVote = async (postId: string) => {
    if (!userEmail) {
      toast.error('Please enter your email before voting.')
      return
    }

    if (votingIds.includes(postId)) return
    setVotingIds((prev) => [...prev, postId])

    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, voter_email: userEmail, voter_name: userName || null }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        toast.error(errorBody?.error || 'Unable to update vote. Please try again.')
        return
      }

      await response.json()

      if (board?.id) {
        await fetchPosts(board.id)
      }
      await fetchVoteStatuses(userEmail, board?.id)
    } finally {
      setVotingIds((prev) => prev.filter((id) => id !== postId))
    }
  }

  const handleSubmitPost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!board?.id) return
    if (!newTitle.trim()) return
    if (!userEmail.trim()) {
      toast.error('Please enter your email to submit feedback.')
      return
    }
    setSubmitLoading(true)

    await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        board_id: board.id,
        title: newTitle,
        content: newContent,
        guest_name: userName || null,
        guest_email: userEmail,
        is_guest: true,
      }),
    })

    setNewTitle('')
    setNewContent('')
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

      {/* User identity section - shared across all actions */}
      <div className="border p-4 rounded max-w-2xl bg-muted/30">
        <h3 className="font-semibold mb-3">Your Information</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Enter your email to vote, comment, and submit feedback.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="userEmail">Email (Required)</Label>
            <Input
              id="userEmail"
              type="email"
              placeholder="you@example.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="userName">Name (Optional)</Label>
            <Input
              id="userName"
              placeholder="Your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="border p-4 rounded max-w-2xl">
        <h3 className="font-semibold mb-4">Submit Feedback</h3>
        <form onSubmit={handleSubmitPost} className="space-y-3">
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
          <Button type="submit" disabled={submitLoading || !newTitle.trim() || !userEmail.trim()}>
            {submitLoading ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </form>
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <Dialog key={post.id}>
            <DialogTrigger asChild>
              <Card className="p-4 flex items-start gap-4 cursor-pointer">
                <Button
                  variant={votedPostIds.includes(post.id) ? 'default' : 'outline'}
                  onClick={(event) => {
                    event.stopPropagation()
                    handleVote(post.id)
                  }}
                  disabled={votingIds.includes(post.id)}
                >
                  {post.vote_count ?? 0}
                </Button>
                <div className="flex-1">
                  {post.is_pinned && (
                    <Badge className="mb-1">Featured</Badge>
                  )}
                  <div className="font-medium">{post.title}</div>
                  <p className="text-sm text-muted-foreground mt-1">{post.content}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                    {post.widget_users?.avatar_url ? (
                      <img
                        src={post.widget_users.avatar_url}
                        alt={post.widget_users.name || post.widget_users.email || 'User'}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px]">
                        {(post.widget_users?.name || post.guest_name || post.author_name || 'G')[0].toUpperCase()}
                      </div>
                    )}
                    <span>
                      {post.widget_users?.name ||
                        post.guest_name ||
                        post.author_name ||
                        'Anonymous'}
                    </span>
                    {post.widget_users?.user_source === 'verified_jwt' && (
                      <Badge className="bg-green-100 text-green-700 text-[10px]">Verified</Badge>
                    )}
                    {post.widget_users?.company_name && (
                      <Badge variant="secondary" className="text-[10px]">
                        {post.widget_users.company_name}
                      </Badge>
                    )}
                    <span>• {formatDate(post.created_at)}</span>
                  </div>
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
                By {post.widget_users?.name ||
                  post.guest_name ||
                  post.author_name ||
                  'Anonymous'} • {formatDate(post.created_at)} • {post.vote_count ?? 0} votes
              </p>
              <Separator className="my-4" />
              <h3 className="font-semibold">Comments</h3>
              <CommentList postId={post.id} refreshTrigger={commentRefresh} userEmail={userEmail} />
              <Separator className="my-4" />
              <CommentForm
                postId={post.id}
                authorEmail={userEmail}
                authorName={userName}
                onCommentAdded={() => setCommentRefresh((prev) => prev + 1)}
              />
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  )
}
