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
      try {
        // Check if we can access parent window (not cross-origin)
        if (window.parent && window.parent !== window) {
          try {
            const parentHub = (window.parent as any)?.FeedbackHub
            if (parentHub && parentHub.isIdentified && parentHub.isIdentified()) {
              setIsIdentified(true)
              setIdentifiedUser(parentHub.getUser ? parentHub.getUser() : null)
              return
            }
          } catch (e) {
            // Cross-origin error - parent is from different origin
            // This is expected when embedded, so we'll just continue without parent access
          }
        }
        // If we can't access parent or no FeedbackHub
        setIsIdentified(false)
        setIdentifiedUser(null)
      } catch (error) {
        // Silently handle any errors
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
    try {
      if (window.parent && window.parent !== window) {
        try {
          const parentHub = (window.parent as any)?.FeedbackHub
          if (parentHub?.identify) {
            parentHub.identify({ id: email, email, name })
            setIsIdentified(true)
            setIdentifiedUser(parentHub.getUser ? parentHub.getUser() : null)
          }
        } catch (e) {
          // Cross-origin error - ignore
        }
      }
    } catch (error) {
      // Silently handle any errors
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

    let identifiedPayload = null
    try {
      if (window.parent && window.parent !== window) {
        try {
          const parentHub = (window.parent as any)?.FeedbackHub
          identifiedPayload = parentHub?._getIdentifyPayload ? parentHub._getIdentifyPayload() : null
        } catch (e) {
          // Cross-origin error - ignore and continue without parent payload
        }
      }
    } catch (error) {
      // Silently handle any errors
    }

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
    <div className="space-y-5">
      {!isIdentified && (
        <AuthPrompt
          orgSlug={orgSlug}
          onGuestSubmit={handleGuestSubmit}
          onSocialClick={handleSocialClick}
        />
      )}

      {isIdentified && (
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="text-sm text-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 rounded-xl border-2 border-gray-200 shadow-sm">
              Posting as <span className="font-bold">{identifiedUser.name || identifiedUser.email}</span>
            </div>
          )}
          <Input
            placeholder="Feedback title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="border-2 border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 h-12 text-base font-medium shadow-sm"
            required
          />
          <Textarea
            placeholder="Describe your feedback..."
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="resize-none overflow-y-auto border-2 border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 shadow-sm"
            style={{
              maxHeight: '200px',
            }}
          />
          <Button
            type="submit"
            disabled={loading || !title.trim()}
            style={{ 
              backgroundColor: accentColor,
              boxShadow: `0 6px 20px -4px ${accentColor}60`
            }}
            className="text-white font-bold text-base py-6 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </Button>
          {success && (
            <p className="text-sm text-green-600 flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
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
