'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
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
}

export function PostDetailView({ post: initialPost, orgSlug, accentColor = '#F59E0B', onBack, onVote }: PostDetailViewProps) {
  const [post, setPost] = useState<PostDetail>(initialPost)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [identifiedUser, setIdentifiedUser] = useState<any>(null)

  // Update post when prop changes
  useEffect(() => {
    setPost(initialPost)
  }, [initialPost])

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

    // Check for identified user - safely handle cross-origin
    const checkIdentifiedUser = () => {
      try {
        // Check if we can access parent window (not cross-origin)
        if (window.parent && window.parent !== window) {
          try {
            const parentHub = (window.parent as any)?.FeedbackHub
            if (parentHub && parentHub.isIdentified && parentHub.isIdentified()) {
              setIdentifiedUser(parentHub.getUser ? parentHub.getUser() : null)
              return
            }
          } catch (e) {
            // Cross-origin error - parent is from different origin
            // This is expected when embedded, so we'll just continue without parent access
          }
        }
        // If we can't access parent or no FeedbackHub, check localStorage or other methods
        setIdentifiedUser(null)
      } catch (error) {
        // Silently handle any errors
        setIdentifiedUser(null)
      }
    }
    checkIdentifiedUser()
    const interval = setInterval(checkIdentifiedUser, 1000)
    return () => clearInterval(interval)
  }, [post.id])

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submitting) return

    setSubmitting(true)
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      let identifiedPayload = null
      
      // Safely try to get identified payload from parent
      try {
        if (window.parent && window.parent !== window) {
          const parentHub = (window.parent as any)?.FeedbackHub
          identifiedPayload = parentHub?._getIdentifyPayload ? parentHub._getIdentifyPayload() : null
        }
      } catch (e) {
        // Cross-origin error - ignore and continue without parent payload
      }

      const res = await fetch(`${baseUrl}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: post.id,
          content: newComment,
          guest_email: identifiedUser?.email,
          guest_name: identifiedUser?.name,
          identified_user: identifiedPayload,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setComments((prev) => [...prev, data.comment])
        setNewComment('')
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

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
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
            className={`flex flex-col items-center justify-center px-4 py-3 rounded-lg border transition-colors shrink-0 ${
              post.hasVoted
                ? 'border-transparent text-white'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
            }`}
            style={
              post.hasVoted
                ? { backgroundColor: accentColor }
                : {}
            }
          >
            <ChevronUp className="h-5 w-5" />
            <span className="text-base font-semibold">{post.votes}</span>
          </button>

          {/* Post details */}
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{post.title}</h2>
            {post.content && (
              <div className="text-sm text-gray-700 whitespace-pre-wrap mb-4">{post.content}</div>
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
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
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
              <div key={comment.id} className="flex gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white shrink-0"
                  style={{ backgroundColor: accentColor }}
                >
                  {(comment.author_name || comment.guest_name || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {comment.author_name || comment.guest_name || 'Anonymous'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add comment form */}
        {identifiedUser && (
          <form onSubmit={handleSubmitComment} className="space-y-2">
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
              disabled={!newComment.trim() || submitting}
              style={{ backgroundColor: accentColor }}
              className="text-white"
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? 'Posting...' : 'Post comment'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
