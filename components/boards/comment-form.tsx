'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Lock, Globe } from 'lucide-react'
import { toast } from 'sonner'

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
  // Local email/name state for when not provided via props
  const [localEmail, setLocalEmail] = useState('')
  const [localName, setLocalName] = useState('')

  // Use props if provided, otherwise use local state
  const effectiveEmail = authorEmail || localEmail
  const effectiveName = authorName || localName
  const showEmailFields = !isAdmin && !authorEmail

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!content.trim()) return
    if (!effectiveEmail.trim()) {
      toast.error('Please enter your email to comment.')
      return
    }
    setLoading(true)
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        post_id: postId,
        content,
        author_email: effectiveEmail,
        author_name: effectiveName || null,
        is_from_admin: isAdmin || false,
        is_internal: isInternal,
      }),
    })

    if (!response.ok) {
      const data = await response.json()
      toast.error(data.error || 'Failed to post comment')
      setLoading(false)
      return
    }

    setContent('')
    onCommentAdded()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {showEmailFields && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor={`comment-email-${postId}`}>Email (Required)</Label>
            <Input
              id={`comment-email-${postId}`}
              type="email"
              placeholder="you@example.com"
              value={localEmail}
              onChange={(e) => setLocalEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`comment-name-${postId}`}>Name (Optional)</Label>
            <Input
              id={`comment-name-${postId}`}
              placeholder="Your name"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
            />
          </div>
        </div>
      )}
      <Textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Write a comment..."
        className={isInternal ? 'border-yellow-400 bg-yellow-50' : ''}
      />
      <div className="flex items-center justify-between">
        <Button type="submit" disabled={loading || !content.trim() || !effectiveEmail.trim()}>
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
