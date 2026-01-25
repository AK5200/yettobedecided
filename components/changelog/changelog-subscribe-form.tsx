'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ChangelogSubscribeFormProps {
  orgId: string
}

export function ChangelogSubscribeForm({ orgId }: ChangelogSubscribeFormProps) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const response = await fetch('/api/changelog/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: orgId, email }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      setMessage(errorData.error || 'Failed to subscribe.')
    } else {
      setMessage('Subscribed! Check your email to confirm.')
      setEmail('')
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col md:flex-row gap-2">
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Subscribing...' : 'Subscribe'}
        </Button>
      </div>
      {message && <p className="text-sm text-gray-600">{message}</p>}
    </form>
  )
}
