'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface CommentFormProps {
  postId: string
  isAdmin?: boolean
  authorEmail?: string
  authorName?: string
  onCommentAdded: () => void
}

export function CommentForm({
  postId,
  isAdmin,
  authorEmail,
  authorName,
  onCommentAdded,
}: CommentFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        post_id: postId,
        content,
        author_email: authorEmail,
        author_name: authorName,
        is_from_admin: isAdmin || false,
      }),
    })
    setContent('')
    onCommentAdded()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Write a comment..."
        className="mb-2"
      />
      <Button type="submit" disabled={loading || !content.trim()}>
        {loading ? 'Posting...' : 'Post Comment'}
      </Button>
    </form>
  )
}
