'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'

interface Webhook {
  id: string
  name: string
  url: string
  secret: string | null
  events: string[]
  is_active: boolean
}

interface WebhooksManagerProps {
  orgId: string
  initialWebhooks: Webhook[]
  availableEvents: string[]
}

export function WebhooksManager({ orgId, initialWebhooks, availableEvents }: WebhooksManagerProps) {
  const [webhooks, setWebhooks] = useState<Webhook[]>(initialWebhooks)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [events, setEvents] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const toggleEvent = (event: string) => {
    setEvents((prev) => (prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const response = await fetch('/api/webhooks-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: orgId, name, url, events, secret: secret || null }),
    })
    if (!response.ok) {
      const errorData = await response.json()
      toast.error(errorData.error || 'Failed to create webhook.')
    } else {
      const data = await response.json()
      setWebhooks((prev) => [data.webhook, ...prev])
      setName('')
      setUrl('')
      setSecret('')
      setEvents([])
      toast.success('Webhook created!')
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Delete this webhook?')
    if (!confirmed) return
    const response = await fetch(`/api/webhooks-settings/${id}`, { method: 'DELETE' })
    if (!response.ok) {
      const errorData = await response.json()
      toast.error(errorData.error || 'Failed to delete webhook.')
      return
    }
    setWebhooks((prev) => prev.filter((w) => w.id !== id))
    toast.success('Webhook deleted.')
  }

  const handleToggle = async (webhook: Webhook) => {
    const response = await fetch(`/api/webhooks-settings/${webhook.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !webhook.is_active }),
    })
    if (!response.ok) {
      const errorData = await response.json()
      toast.error(errorData.error || 'Failed to update webhook.')
      return
    }
    setWebhooks((prev) =>
      prev.map((w) => (w.id === webhook.id ? { ...w, is_active: !w.is_active } : w))
    )
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleCreate} className="space-y-4 border rounded-lg p-6">
        <h2 className="text-lg font-semibold">Create Webhook</h2>
        <div className="space-y-2">
          <Label htmlFor="webhook-name">Name</Label>
          <Input id="webhook-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="webhook-url">URL</Label>
          <Input id="webhook-url" value={url} onChange={(e) => setUrl(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="webhook-secret">Secret (optional)</Label>
          <Input id="webhook-secret" value={secret} onChange={(e) => setSecret(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Events</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {availableEvents.map((event) => (
              <label key={event} className="flex items-center gap-2 text-sm">
                <Checkbox checked={events.includes(event)} onCheckedChange={() => toggleEvent(event)} />
                {event}
              </label>
            ))}
          </div>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Webhook'}
        </Button>
      </form>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Existing Webhooks</h2>
        {webhooks.length === 0 ? (
          <p className="text-sm text-gray-600">No webhooks created yet.</p>
        ) : (
          webhooks.map((webhook) => (
            <div key={webhook.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{webhook.name}</div>
                  <div className="text-sm text-gray-600">{webhook.url}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => handleToggle(webhook)}>
                    {webhook.is_active ? 'Disable' : 'Enable'}
                  </Button>
                  <Button variant="destructive" onClick={() => handleDelete(webhook.id)}>
                    Delete
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {webhook.events?.map((event) => (
                  <Badge key={event} variant="secondary">
                    {event}
                  </Badge>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
