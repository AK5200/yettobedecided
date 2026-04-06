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
  const [orgSlugState, setOrgSlugState] = useState('')
  const [guestCommentingEnabled, setGuestCommentingEnabled] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [pendingPost, setPendingPost] = useState<{ title: string } | null>(null)
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
      setOrgSlugState(orgSlug)

      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', orgSlug)
        .single()

      if (!orgData) {
        setLoading(false)
        return
      }
      setGuestCommentingEnabled(orgData.guest_commenting_enabled !== false)

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

  // Get or create anonymous voter ID for guest voting
  const getVoterId = () => {
    if (userEmail) return userEmail
    try {
      let anonId = localStorage.getItem('kelo_anon_voter')
      if (!anonId) {
        anonId = 'anon_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
        localStorage.setItem('kelo_anon_voter', anonId)
      }
      return anonId
    } catch {
      return 'anon_' + Math.random().toString(36).substring(2)
    }
  }

  useEffect(() => {
    const voterId = getVoterId()
    fetchVoteStatuses(voterId, board?.id)
  }, [userEmail, board?.id])

  const handleVote = async (postId: string) => {
    const voterId = getVoterId()

    if (votingIds.includes(postId)) return
    setVotingIds((prev) => [...prev, postId])

    // Optimistic UI: toggle vote immediately
    const wasVoted = votedPostIds.includes(postId)
    setVotedPostIds((prev) => wasVoted ? prev.filter(id => id !== postId) : [...prev, postId])
    setPosts((prev) => prev.map(p =>
      p.id === postId ? { ...p, vote_count: (p.vote_count ?? 0) + (wasVoted ? -1 : 1) } : p
    ))

    try {
      const response = await fetch('/api/widget/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, email: voterId }),
      })

      if (!response.ok) {
        // Revert optimistic update
        setVotedPostIds((prev) => wasVoted ? [...prev, postId] : prev.filter(id => id !== postId))
        setPosts((prev) => prev.map(p =>
          p.id === postId ? { ...p, vote_count: (p.vote_count ?? 0) + (wasVoted ? 1 : -1) } : p
        ))
        const errorBody = await response.json().catch(() => ({}))
        toast.error(errorBody?.error || 'Unable to update vote. Please try again.')
      }
    } finally {
      setVotingIds((prev) => prev.filter((id) => id !== postId))
    }
  }

  const handleSubmitPost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!board?.id) return
    if (!newTitle.trim()) return
    if (!userName.trim()) {
      toast.error('Please enter your name to submit feedback.')
      return
    }
    setSubmitLoading(true)

    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        board_id: board.id,
        title: newTitle,
        content: newContent,
        guest_name: userName || 'Anonymous',
        guest_email: userEmail || null,
        is_guest: true,
      }),
    })

    const savedTitle = newTitle
    setNewTitle('')
    setNewContent('')

    if (res.ok) {
      const data = await res.json()
      if (data.post?.is_approved === false) {
        setPendingPost({ title: savedTitle })
      } else {
        setPendingPost(null)
      }
    }

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

      {/* User identity section */}
      <div className="border border-border/60 p-5 rounded-xl max-w-2xl bg-muted/20">
        <h3 className="font-semibold mb-1">Your Information</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Add your name to submit feedback. Email is optional but needed for voting.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="userName">Name</Label>
            <Input
              id="userName"
              placeholder="Your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="userEmail">Email <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              id="userEmail"
              type="email"
              placeholder="you@example.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
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
          <Button type="submit" disabled={submitLoading || !newTitle.trim() || !userName.trim()}>
            {submitLoading ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </form>
      </div>

      <div className="space-y-4">
        {pendingPost && (
          <Card className="p-4 flex items-start gap-4 opacity-60 border-amber-200 bg-amber-50/50">
            <Button variant="outline" disabled>0</Button>
            <div className="flex-1">
              <div className="font-medium">{pendingPost.title}</div>
              <p className="text-xs text-amber-700 mt-2 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
                Waiting for admin approval
              </p>
            </div>
          </Card>
        )}
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
                guestCommentingEnabled={guestCommentingEnabled}
                orgSlug={orgSlugState}
              />
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  )
}
