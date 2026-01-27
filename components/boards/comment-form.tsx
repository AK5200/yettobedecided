'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Lock, Globe } from 'lucide-react'

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
  const [isInternal, setIsInternal] = useState(false)

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
        is_internal: isInternal,
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
        className={`mb-2 ${isInternal ? 'border-yellow-400 bg-yellow-50' : ''}`}
      />
      <div className="flex items-center justify-between">
        <Button type="submit" disabled={loading || !content.trim()}>
          {loading ? 'Posting...' : 'Post Comment'}
        </Button>
        {isAdmin && (
          <div className='flex items-center gap-2'>
            <Switch checked={isInternal} onCheckedChange={setIsInternal} />
            <span className='text-sm flex items-center gap-1'>
              {isInternal ? (
                <><Lock className='w-4 h-4 text-yellow-600' /> Internal</>
              ) : (
                <><Globe className='w-4 h-4 text-gray-500' /> Public</>
              )}
            </span>
          </div>
        )}
      </div>
    </form>
  )
}
