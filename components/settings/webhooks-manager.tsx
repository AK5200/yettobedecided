'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Webhook, Trash2, Globe, Eye, EyeOff } from 'lucide-react'

interface WebhookData {
  id: string
  name: string
  url: string
  secret: string | null
  events: string[]
  is_active: boolean
}

interface WebhooksManagerProps {
  orgId: string
  initialWebhooks: WebhookData[]
  availableEvents: string[]
}

const EVENT_LABELS: Record<string, string> = {
  'post.created': 'New Post',
  'post.status_changed': 'Status Changed',
  'post.voted': 'Post Voted',
  'comment.created': 'New Comment',
  'changelog.published': 'Changelog Published',
}

export function WebhooksManager({ orgId, initialWebhooks, availableEvents }: WebhooksManagerProps) {
  const [webhooks, setWebhooks] = useState<WebhookData[]>(initialWebhooks)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    secret: '',
    events: [] as string[],
  })

  const toggleEvent = (event: string) => {
    setNewWebhook((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }))
  }

  const handleCreate = async () => {
    if (!newWebhook.name.trim() || !newWebhook.url.trim()) return
    setSaving(true)

    const response = await fetch('/api/webhooks-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        org_id: orgId,
        name: newWebhook.name,
        url: newWebhook.url,
        events: newWebhook.events,
        secret: newWebhook.secret || null,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      toast.error(errorData.error || 'Failed to create webhook')
    } else {
      const data = await response.json()
      setWebhooks((prev) => [data.webhook, ...prev])
      setNewWebhook({ name: '', url: '', secret: '', events: [] })
      setIsCreateDialogOpen(false)
      toast.success('Webhook created!')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return

    const response = await fetch(`/api/webhooks-settings/${id}`, { method: 'DELETE' })
    if (!response.ok) {
      const errorData = await response.json()
      toast.error(errorData.error || 'Failed to delete webhook')
      return
    }
    setWebhooks((prev) => prev.filter((w) => w.id !== id))
    toast.success('Webhook deleted!')
  }

  const handleToggle = async (webhook: WebhookData) => {
    const response = await fetch(`/api/webhooks-settings/${webhook.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !webhook.is_active }),
    })
    if (!response.ok) {
      const errorData = await response.json()
      toast.error(errorData.error || 'Failed to update webhook')
      return
    }
    setWebhooks((prev) =>
      prev.map((w) => (w.id === webhook.id ? { ...w, is_active: !w.is_active } : w))
    )
    toast.success(webhook.is_active ? 'Webhook disabled' : 'Webhook enabled')
  }

  return (
    <div className="space-y-6">
      {/* Add Webhook Button */}
      <div className="flex justify-end">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Webhook</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="webhookName">Name</Label>
                <Input
                  id="webhookName"
                  placeholder="e.g., Slack Notifications"
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Endpoint URL</Label>
                <Input
                  id="webhookUrl"
                  placeholder="https://your-server.com/webhook"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookSecret">Secret (optional)</Label>
                <Input
                  id="webhookSecret"
                  placeholder="Used to verify webhook signatures"
                  value={newWebhook.secret}
                  onChange={(e) => setNewWebhook({ ...newWebhook, secret: e.target.value })}
                />
              </div>

              <div className="space-y-3">
                <Label>Events to Subscribe</Label>
                <div className="space-y-2">
                  {availableEvents.map((event) => (
                    <div
                      key={event}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50"
                    >
                      <span className="text-sm text-gray-700">
                        {EVENT_LABELS[event] || event}
                      </span>
                      <Switch
                        checked={newWebhook.events.includes(event)}
                        onCheckedChange={() => toggleEvent(event)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={saving || !newWebhook.name.trim() || !newWebhook.url.trim()}
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                >
                  {saving ? 'Creating...' : 'Create Webhook'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Webhooks List */}
      <div className="space-y-3">
        {webhooks.length === 0 ? (
          <Card className="p-8 text-center">
            <Webhook className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No webhooks yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Create your first webhook to receive real-time notifications
            </p>
          </Card>
        ) : (
          webhooks.map((webhook) => (
            <Card key={webhook.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    webhook.is_active ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <Globe className={`h-5 w-5 ${
                      webhook.is_active ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{webhook.name}</h3>
                      {webhook.is_active ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          Disabled
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate max-w-md">{webhook.url}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {webhook.events?.map((event) => (
                        <Badge
                          key={event}
                          variant="secondary"
                          className="text-xs bg-amber-50 text-amber-700 hover:bg-amber-100"
                        >
                          {EVENT_LABELS[event] || event}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggle(webhook)}
                    className="gap-1"
                  >
                    {webhook.is_active ? (
                      <>
                        <EyeOff className="h-4 w-4" />
                        Disable
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        Enable
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(webhook.id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
