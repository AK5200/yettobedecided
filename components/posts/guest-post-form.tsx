'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

interface GuestPostFormProps {
  boardId: string
  onPostCreated?: () => void
}

export function GuestPostForm({ boardId, onPostCreated }: GuestPostFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content: description,
          board_id: boardId,
          guest_email: email,
          guest_name: name,
          is_guest: true,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit post')
      }

      setSuccess(true)
      setTitle('')
      setDescription('')
      setEmail('')
      setName('')
      onPostCreated?.()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-6">
        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">Submitted!</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Thanks for your feedback. We&apos;ll keep you posted.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Submit another
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="guest-title" className="text-sm font-medium text-foreground/80">
          Title
        </label>
        <Input
          id="guest-title"
          placeholder="Short, descriptive title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="h-10 rounded-lg border-border text-sm placeholder:text-muted-foreground/60"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="guest-desc" className="text-sm font-medium text-foreground/80">
          Description
          <span className="text-muted-foreground/60 font-normal ml-1">(optional)</span>
        </label>
        <Textarea
          id="guest-desc"
          placeholder="Tell us more about your idea..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="rounded-lg border-border text-sm placeholder:text-muted-foreground/60 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="guest-email" className="text-sm font-medium text-foreground/80">
            Email
          </label>
          <Input
            id="guest-email"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-10 rounded-lg border-border text-sm placeholder:text-muted-foreground/60"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="guest-name" className="text-sm font-medium text-foreground/80">
            Name
            <span className="text-muted-foreground/60 font-normal ml-1">(optional)</span>
          </label>
          <Input
            id="guest-name"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-10 rounded-lg border-border text-sm placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-10 bg-linear-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 rounded-lg text-sm font-semibold shadow-sm border border-yellow-400/50"
      >
        {loading ? 'Submitting...' : 'Submit'}
      </Button>
    </form>
  )
}
