'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface FeedbackBoard {
  id: string
  name: string
}

interface FeedbackWidgetProps {
  boards: FeedbackBoard[]
  orgSlug: string
  onSubmit?: () => void
  accentColor?: string
  showBranding?: boolean
}

export function FeedbackWidget({
  boards,
  orgSlug,
  onSubmit,
  accentColor = '#000000',
  showBranding = true,
}: FeedbackWidgetProps) {
  const [selectedBoard, setSelectedBoard] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!selectedBoard && boards.length > 0) {
      setSelectedBoard(boards[0].id)
    }
  }, [boards, selectedBoard])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedBoard || !title.trim()) return
    setLoading(true)
    setSuccess(false)

    const response = await fetch('/api/widget/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        org_slug: orgSlug,
        board_id: selectedBoard,
        title,
        content,
        author_email: email,
        author_name: name,
      }),
    })

    if (response.ok) {
      setTitle('')
      setContent('')
      setEmail('')
      setName('')
      setSuccess(true)
      onSubmit?.()
    }

    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        {boards.length > 1 && (
          <Select value={selectedBoard} onValueChange={setSelectedBoard}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a board" />
            </SelectTrigger>
            <SelectContent>
              {boards.map((board) => (
                <SelectItem key={board.id} value={board.id}>
                  {board.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Input
          placeholder="Your email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Input
          placeholder="Your name (optional)"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          placeholder="Feedback title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
        <Textarea
          placeholder="Describe your feedback..."
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
        <Button
          type="submit"
          disabled={loading || !title.trim()}
          style={{ backgroundColor: accentColor }}
        >
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </Button>
        {success && <p className="text-sm text-gray-600">Thanks for the feedback!</p>}
      </form>
      {showBranding && (
        <div className="text-xs text-gray-500 text-center">Powered by FeedbackHub</div>
      )}
    </div>
  )
}
