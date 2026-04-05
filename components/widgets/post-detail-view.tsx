'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, ChevronUp, Send } from 'lucide-react'

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

  useEffect(() => { setPost(initialPost) }, [initialPost])

  useEffect(() => {
    if (identifiedUserProp) setIdentifiedUser(identifiedUserProp)
  }, [identifiedUserProp])

  useEffect(() => {
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

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'kelo:identity') {
        const user = event.data.user
        if (user) {
          setIdentifiedUser(user)
          try { sessionStorage.setItem(`kelo_identified_user_${orgSlug}`, JSON.stringify(user)) } catch {}
        }
      }
    }
    window.addEventListener('message', handleMessage)

    if (!identifiedUserProp) {
      try {
        const stored = sessionStorage.getItem(`kelo_identified_user_${orgSlug}`)
        if (stored) setIdentifiedUser(JSON.parse(stored))
      } catch {}
    }

    return () => window.removeEventListener('message', handleMessage)
  }, [post.id, identifiedUserProp])

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    try {
      return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: '2-digit', timeZone: 'UTC' }).format(new Date(dateString))
    } catch { return '' }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submitting) return
    const email = identifiedUser?.email || commentEmail || null
    const name = identifiedUser?.name || commentName
    if (!name && !email) return

    const content = newComment.trim()
    const tempId = `temp-${Date.now()}`
    const optimisticComment: Comment = { id: tempId, content, author_name: name || undefined, author_email: email, created_at: new Date().toISOString() }
    setComments((prev) => [...prev, optimisticComment])
    setNewComment('')

    setSubmitting(true)
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const res = await fetch(`${baseUrl}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: post.id, content, guest_email: email, guest_name: name }),
      })
      if (res.ok) {
        const data = await res.json()
        setComments((prev) => prev.map((c) => c.id === tempId ? data.comment : c))
      } else {
        setComments((prev) => prev.filter((c) => c.id !== tempId))
      }
    } catch {
      setComments((prev) => prev.filter((c) => c.id !== tempId))
    } finally {
      setSubmitting(false)
    }
  }

  const handleVote = () => {
    setPost((prev) => ({ ...prev, votes: prev.hasVoted ? prev.votes - 1 : prev.votes + 1, hasVoted: !prev.hasVoted }))
    onVote?.(post.id)
  }

  const canSubmitComment = newComment.trim() && (identifiedUser?.name || identifiedUser?.email || commentName)

  return (
    <div className="flex flex-col h-full">
      {/* Header: back + title + vote — compact */}
      <div className="px-5 pt-4 pb-4 border-b border-border/40 dark:border-white/8 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-all duration-200 mb-3 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>

        <div className="flex items-start gap-3">
          {/* Compact vote button */}
          <button
            onClick={handleVote}
            className={`flex flex-col items-center justify-center w-11 h-11 rounded-xl border transition-all duration-200 shrink-0 cursor-pointer hover:shadow-sm active:scale-95 ${
              post.hasVoted
                ? 'border-transparent text-white'
                : 'border-border/60 text-muted-foreground hover:border-border bg-muted/20 dark:bg-white/5'
            }`}
            style={post.hasVoted ? { backgroundColor: accentColor, boxShadow: `0 4px 12px -2px ${accentColor}50` } : {}}
          >
            <ChevronUp className="h-3.5 w-3.5 -mb-0.5" />
            <span className="text-xs font-bold">{post.votes}</span>
          </button>

          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-snug">{post.title}</h2>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground/60">
              {post.author_name && (
                <span className="font-medium text-muted-foreground">{post.author_name}</span>
              )}
              {post.created_at && <span>{formatDate(post.created_at)}</span>}
            </div>
          </div>
        </div>

        {/* Post content */}
        {post.content && (
          <p className="text-sm text-foreground/70 mt-3 leading-relaxed whitespace-pre-wrap">{post.content}</p>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {post.tags.map((tag) => (
              <span key={tag.name} className="px-2 py-0.5 bg-muted/50 dark:bg-white/8 rounded-full text-[10px] font-medium text-muted-foreground">
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Comments — scrollable, takes remaining space */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider mb-3">
          Comments {comments.length > 0 && `(${comments.length})`}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground/40 text-sm">
            No comments yet. Be the first!
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 group">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: accentColor }}
                >
                  {(comment.author_name || comment.guest_name || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-foreground">
                      {comment.author_name || comment.guest_name || 'Anonymous'}
                    </span>
                    <span className="text-[10px] text-muted-foreground/40">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/70 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comment form — pinned at bottom */}
      <div className="px-5 py-3 border-t border-border/40 dark:border-white/8 shrink-0 bg-background dark:bg-[#1a1a1a]">
        <form onSubmit={handleSubmitComment} className="space-y-2.5">
          {!identifiedUser && (
            <Input
              placeholder="Your name"
              value={commentName}
              onChange={(e) => setCommentName(e.target.value)}
              className="h-9 text-sm rounded-lg border-border/50 dark:border-white/10 focus:ring-1 focus:ring-offset-0 transition-all duration-200"
              style={{ '--tw-ring-color': `${accentColor}30` } as React.CSSProperties}
            />
          )}
          <div className="flex gap-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={1}
              className="flex-1 resize-none text-sm rounded-lg border-border/50 dark:border-white/10 focus:ring-1 focus:ring-offset-0 transition-all duration-200 min-h-[36px] max-h-[80px]"
              style={{ '--tw-ring-color': `${accentColor}30` } as React.CSSProperties}
            />
            <Button
              type="submit"
              disabled={!canSubmitComment || submitting}
              style={{ backgroundColor: accentColor }}
              className="text-white rounded-lg h-9 w-9 p-0 hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-40 shrink-0"
              size="sm"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
