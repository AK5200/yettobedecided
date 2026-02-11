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
      if (event.data && event.data.type === 'feedbackhub:identity') {
        const user = event.data.user
        if (user) {
          setIdentifiedUser(user)
          try {
            sessionStorage.setItem('feedbackhub_identified_user', JSON.stringify(user))
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
        const stored = sessionStorage.getItem('feedbackhub_identified_user')
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
      }
    } catch (error) {
      console.error('Failed to submit comment:', error)
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
    <div className="space-y-4">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-all hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent px-4 py-2.5 rounded-xl -ml-4 cursor-pointer shadow-sm hover:shadow-md"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to board
      </button>

      {/* Post content */}
      <div className="space-y-4">
        <div className="flex gap-4">
          {/* Vote button */}
          <button
            onClick={handleVote}
            className={`flex flex-col items-center justify-center px-5 py-4 rounded-lg border transition-all shrink-0 cursor-pointer hover:scale-105 active:scale-95 ${
              post.hasVoted
                ? 'border-transparent text-white shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm text-gray-600 bg-gray-50 hover:bg-white'
            }`}
            style={
              post.hasVoted
                ? {
                    backgroundColor: accentColor,
                    boxShadow: `0 4px 12px -2px ${accentColor}40`
                  }
                : {}
            }
          >
            <ChevronUp className="h-5 w-5" />
            <span className="text-base font-semibold">{post.votes}</span>
          </button>

          {/* Post details */}
          <div className="flex-1">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{post.title}</h2>
            {post.content && (
              <div className="text-base text-gray-700 whitespace-pre-wrap mb-5 leading-relaxed bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl border-2 border-gray-200 shadow-sm">{post.content}</div>
            )}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {post.author_name && (
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    {post.author_name.charAt(0).toUpperCase()}
                  </div>
                  <span>{post.author_name}</span>
                </div>
              )}
              {post.created_at && (
                <span>{formatDate(post.created_at)}</span>
              )}
              {post.tags?.map((tag) => (
                <span key={tag.name} className="px-2 py-1 bg-gray-100 rounded text-gray-600">
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Comments section */}
      <div className="border-t pt-4">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-4 w-4 text-gray-500" />
          <h3 className="font-medium text-gray-900">
            Comments {comments.length > 0 && `(${comments.length})`}
          </h3>
        </div>

        {/* Comments list */}
        <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-gray-500 text-sm">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No comments yet.</div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all border border-gray-100 hover:border-gray-200 hover:shadow-sm">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-md"
                  style={{ backgroundColor: accentColor }}
                >
                  {(comment.author_name || comment.guest_name || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-bold text-gray-900">
                      {comment.author_name || comment.guest_name || 'Anonymous'}
                    </span>
                    <span className="text-xs text-gray-500 font-semibold">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add comment form - always visible */}
        <form onSubmit={handleSubmitComment} className="space-y-2">
          {!identifiedUser && (
            <div className="flex gap-2">
              <Input
                placeholder="Email *"
                type="email"
                value={commentEmail}
                onChange={(e) => setCommentEmail(e.target.value)}
                className="border-gray-200"
                required
              />
              <Input
                placeholder="Name (optional)"
                value={commentName}
                onChange={(e) => setCommentName(e.target.value)}
                className="border-gray-200"
              />
            </div>
          )}
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="resize-none overflow-y-auto"
            style={{
              maxHeight: '120px',
            }}
          />
          <Button
            type="submit"
            disabled={!canSubmitComment || submitting}
            style={{
              backgroundColor: accentColor,
              boxShadow: `0 4px 12px -2px ${accentColor}40`
            }}
            className="text-white font-semibold hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
