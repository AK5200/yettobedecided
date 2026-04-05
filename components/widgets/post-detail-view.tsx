'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, ChevronUp, MessageSquare, Send } from 'lucide-react'

interface Comment {
  id: string
  content: string
  author_name?: string
  author_email?: string
  guest_name?: string
  created_at: string
}

interface PostDetail {
  id: string
  title: string
  content: string
  votes: number
  author_name?: string
  author_email?: string
  tags?: { name: string }[]
  hasVoted?: boolean
  created_at?: string
}

interface PostDetailViewProps {
  post: PostDetail
  orgSlug: string
  accentColor?: string
  onBack: () => void
  onVote?: (postId: string) => void
  identifiedUser?: any
}

export function PostDetailView({ post: initialPost, orgSlug, accentColor = '#F59E0B', onBack, onVote, identifiedUser: identifiedUserProp }: PostDetailViewProps) {
  const [post, setPost] = useState<PostDetail>(initialPost)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [identifiedUser, setIdentifiedUser] = useState<any>(identifiedUserProp || null)
  const [commentEmail, setCommentEmail] = useState('')
  const [commentName, setCommentName] = useState('')

  // Update post when prop changes
  useEffect(() => {
    setPost(initialPost)
  }, [initialPost])

  // Sync identifiedUser from prop
  useEffect(() => {
    if (identifiedUserProp) {
      setIdentifiedUser(identifiedUserProp)
    }
  }, [identifiedUserProp])

  useEffect(() => {
    // Fetch comments
    const fetchComments = async () => {
      try {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        const res = await fetch(`${baseUrl}/api/comments?post_id=${post.id}`)
        if (res.ok) {
          const data = await res.json()
          setComments(data.comments || [])
        }
      } catch (error) {
        console.error('Failed to fetch comments:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchComments()

    // Listen for identity from parent via postMessage
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'kelo:identity') {
        const user = event.data.user
        if (user) {
          setIdentifiedUser(user)
          try {
            sessionStorage.setItem(`kelo_identified_user_${orgSlug}`, JSON.stringify(user))
          } catch {
            // Ignore storage errors
          }
        }
      }
    }

    window.addEventListener('message', handleMessage)

    // Check sessionStorage for existing identity (only if no prop provided)
    if (!identifiedUserProp) {
      try {
        const stored = sessionStorage.getItem(`kelo_identified_user_${orgSlug}`)
        if (stored) {
          setIdentifiedUser(JSON.parse(stored))
        }
      } catch {
        // Ignore storage errors
      }
    }

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [post.id, identifiedUserProp])

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        timeZone: 'UTC',
      }).format(date)
    } catch {
      return ''
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submitting) return

    const email = identifiedUser?.email || commentEmail
    const name = identifiedUser?.name || commentName
    if (!email) return

    const content = newComment.trim()

    // Optimistic: show the comment immediately
    const tempId = `temp-${Date.now()}`
    const optimisticComment: Comment = {
      id: tempId,
      content,
      author_name: name || undefined,
      author_email: email,
      created_at: new Date().toISOString(),
    }
    setComments((prev) => [...prev, optimisticComment])
    setNewComment('')

    setSubmitting(true)
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

      const res = await fetch(`${baseUrl}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: post.id,
          content,
          guest_email: email,
          guest_name: name,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        // Replace optimistic comment with real server data
        setComments((prev) => prev.map((c) => c.id === tempId ? data.comment : c))
      } else {
        // Rollback optimistic comment on failure
        setComments((prev) => prev.filter((c) => c.id !== tempId))
      }
    } catch (error) {
      console.error('Failed to submit comment:', error)
      // Rollback optimistic comment on network error
      setComments((prev) => prev.filter((c) => c.id !== tempId))
    } finally {
      setSubmitting(false)
    }
  }

  const handleVote = () => {
    // Update local state optimistically
    setPost((prev) => ({
      ...prev,
      votes: prev.hasVoted ? prev.votes - 1 : prev.votes + 1,
      hasVoted: !prev.hasVoted,
    }))
    onVote?.(post.id)
  }

  const canSubmitComment = newComment.trim() && (identifiedUser?.email || commentEmail)

  return (
    <div className="space-y-5">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-200 px-3 py-2 rounded-xl -ml-3 cursor-pointer hover:bg-muted/50 dark:hover:bg-white/5"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to board
      </button>

      {/* Post content */}
      <div className="space-y-5">
        <div className="flex gap-4">
          {/* Vote button */}
          <button
            onClick={handleVote}
            className={`flex flex-col items-center justify-center w-16 py-3 rounded-xl border-2 transition-all duration-200 shrink-0 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
              post.hasVoted
                ? 'border-transparent text-white shadow-lg'
                : 'border-border hover:border-border/80 hover:shadow-md text-muted-foreground bg-muted/30 dark:bg-white/5 hover:bg-muted/50'
            }`}
            style={
              post.hasVoted
                ? {
                    backgroundColor: accentColor,
                    boxShadow: `0 8px 20px -4px ${accentColor}50`
                  }
                : {}
            }
          >
            <ChevronUp className="h-5 w-5" />
            <span className="text-base font-bold">{post.votes}</span>
          </button>

          {/* Post details */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-foreground mb-3 leading-tight">{post.title}</h2>
            {post.content && (
              <div className="text-sm text-foreground/80 whitespace-pre-wrap mb-4 leading-relaxed bg-muted/30 dark:bg-white/5 p-5 rounded-xl border border-border/50 dark:border-white/10">{post.content}</div>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              {post.author_name && (
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white shadow-sm"
                    style={{ backgroundColor: accentColor }}
                  >
                    {post.author_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium">{post.author_name}</span>
                </div>
              )}
              {post.created_at && (
                <span className="text-muted-foreground/60">{formatDate(post.created_at)}</span>
              )}
              {post.tags?.map((tag) => (
                <span key={tag.name} className="px-2.5 py-0.5 bg-muted/60 dark:bg-white/10 rounded-full text-muted-foreground text-xs font-medium">
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Comments section */}
      <div className="border-t border-border/60 dark:border-white/10 pt-5">
        <div className="flex items-center gap-2 mb-5">
          <MessageSquare className="h-4 w-4 text-muted-foreground/70" />
          <h3 className="font-semibold text-foreground text-sm">
            Comments {comments.length > 0 && <span className="text-muted-foreground font-normal">({comments.length})</span>}
          </h3>
        </div>

        {/* Comments list */}
        <div className="space-y-3 mb-5 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-5 h-5 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground/60 text-sm">
              No comments yet. Be the first to share your thoughts.
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3.5 p-4 rounded-xl bg-muted/20 dark:bg-white/3 border border-border/30 dark:border-white/6 transition-all duration-200 hover:border-border/60 dark:hover:border-white/10">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm"
                  style={{ backgroundColor: accentColor }}
                >
                  {(comment.author_name || comment.guest_name || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="text-sm font-semibold text-foreground">
                      {comment.author_name || comment.guest_name || 'Anonymous'}
                    </span>
                    <span className="text-xs text-muted-foreground/50">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/75 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add comment form */}
        <form onSubmit={handleSubmitComment} className="space-y-3">
          {!identifiedUser && (
            <div className="flex gap-2.5">
              <Input
                placeholder="Email *"
                type="email"
                value={commentEmail}
                onChange={(e) => setCommentEmail(e.target.value)}
                className="h-11 rounded-xl border-border/60 dark:border-white/10 focus:ring-2 focus:ring-offset-0 transition-all duration-200"
                style={{ '--tw-ring-color': `${accentColor}30` } as React.CSSProperties}
                required
              />
              <Input
                placeholder="Name (optional)"
                value={commentName}
                onChange={(e) => setCommentName(e.target.value)}
                className="h-11 rounded-xl border-border/60 dark:border-white/10 focus:ring-2 focus:ring-offset-0 transition-all duration-200"
                style={{ '--tw-ring-color': `${accentColor}30` } as React.CSSProperties}
              />
            </div>
          )}
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="resize-none overflow-y-auto rounded-xl border-border/60 dark:border-white/10 focus:ring-2 focus:ring-offset-0 transition-all duration-200"
            style={{
              maxHeight: '120px',
              '--tw-ring-color': `${accentColor}30`,
            } as React.CSSProperties}
          />
          <Button
            type="submit"
            disabled={!canSubmitComment || submitting}
            style={{
              backgroundColor: accentColor,
              boxShadow: `0 4px 14px -3px ${accentColor}40`
            }}
            className="text-white font-semibold rounded-xl h-10 px-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
            size="sm"
          >
            <Send className="h-4 w-4 mr-2" />
            {submitting ? 'Posting...' : 'Post comment'}
          </Button>
        </form>
      </div>
    </div>
  )
}
