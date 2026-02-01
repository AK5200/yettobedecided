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
import { Check } from 'lucide-react'
import { AuthPrompt } from './auth-prompt'

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
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [identifiedUser, setIdentifiedUser] = useState<any>(null)
  const [isIdentified, setIsIdentified] = useState(false)

  useEffect(() => {
    if (!selectedBoard && boards.length > 0) {
      setSelectedBoard(boards[0].id)
    }
  }, [boards, selectedBoard])

  useEffect(() => {
    const checkIdentifiedUser = () => {
      const parentHub = (window.parent as any)?.FeedbackHub
      if (parentHub && parentHub.isIdentified && parentHub.isIdentified()) {
        setIsIdentified(true)
        setIdentifiedUser(parentHub.getUser ? parentHub.getUser() : null)
      } else {
        setIsIdentified(false)
        setIdentifiedUser(null)
      }
    }

    checkIdentifiedUser()
    const interval = setInterval(checkIdentifiedUser, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleGuestSubmit = (email: string, name: string) => {
    if (!email) return
    const parentHub = (window.parent as any)?.FeedbackHub
    if (parentHub?.identify) {
      parentHub.identify({ id: email, email, name })
      setIsIdentified(true)
      setIdentifiedUser(parentHub.getUser ? parentHub.getUser() : null)
    }
  }

  const handleSocialClick = (provider: 'google' | 'github') => {
    const returnUrl = window.location.href
    window.location.href = `/api/auth/widget/${provider}?org_slug=${encodeURIComponent(orgSlug)}&return_url=${encodeURIComponent(returnUrl)}`
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedBoard || !title.trim()) return
    setLoading(true)
    setSuccess(false)

    const parentHub = (window.parent as any)?.FeedbackHub
    const identifiedPayload = parentHub?._getIdentifyPayload ? parentHub._getIdentifyPayload() : null

    const response = await fetch('/api/widget/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        org_slug: orgSlug,
        board_id: selectedBoard,
        title,
        content,
        guest_email: identifiedUser?.email,
        guest_name: identifiedUser?.name,
        identified_user: identifiedPayload,
      }),
    })

    if (response.ok) {
      setTitle('')
      setContent('')
      setSuccess(true)
      onSubmit?.()
    }

    setLoading(false)
  }

  return (
    <div className="space-y-4">
      {!isIdentified && (
        <AuthPrompt
          orgSlug={orgSlug}
          onGuestSubmit={handleGuestSubmit}
          onSocialClick={handleSocialClick}
        />
      )}

      {isIdentified && (
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
          {identifiedUser && (
            <div className="text-sm text-gray-600">
              Posting as {identifiedUser.name || identifiedUser.email}
            </div>
          )}
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
            className="text-white"
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </Button>
          {success && (
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Check className="h-4 w-4" />
              Thanks for the feedback!
            </p>
          )}
        </form>
      )}

      {showBranding && (
        <div className="text-xs text-gray-500 text-center">Powered by FeedbackHub</div>
      )}
    </div>
  )
}
