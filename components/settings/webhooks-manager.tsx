'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

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
  const { theme } = useTheme()
  const isDark = theme === 'dark'

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

  const inputClasses = isDark
    ? 'bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30'
    : 'bg-kelo-surface border-kelo-border text-kelo-ink placeholder:text-kelo-muted'

  return (
    <div className="space-y-6">
      {/* Header with Add Webhook button */}
      <div className="flex justify-end">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-kelo-yellow text-kelo-ink font-semibold text-sm hover:bg-kelo-yellow-dark transition-colors">
              {/* Plus icon */}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Add Webhook
            </button>
          </DialogTrigger>
          <DialogContent className={`max-w-md rounded-2xl ${isDark ? 'bg-[#111111] border-white/[0.07]' : 'bg-white border-kelo-border'}`}>
            <DialogHeader>
              <DialogTitle className={`font-display font-extrabold text-lg ${isDark ? 'text-white' : 'text-kelo-ink'}`}>
                Create New Webhook
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* Name */}
              <div className="space-y-2">
                <label htmlFor="webhookName" className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-kelo-ink'}`}>
                  Name
                </label>
                <input
                  id="webhookName"
                  type="text"
                  placeholder="e.g., Slack Notifications"
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-kelo-yellow/40 transition-shadow ${inputClasses}`}
                />
              </div>

              {/* URL */}
              <div className="space-y-2">
                <label htmlFor="webhookUrl" className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-kelo-ink'}`}>
                  Endpoint URL
                </label>
                <input
                  id="webhookUrl"
                  type="text"
                  placeholder="https://your-server.com/webhook"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-kelo-yellow/40 transition-shadow ${inputClasses}`}
                />
              </div>

              {/* Secret */}
              <div className="space-y-2">
                <label htmlFor="webhookSecret" className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-kelo-ink'}`}>
                  Secret <span className={`font-normal ${isDark ? 'text-white/40' : 'text-kelo-muted'}`}>(optional)</span>
                </label>
                <input
                  id="webhookSecret"
                  type="text"
                  placeholder="Used to verify webhook signatures"
                  value={newWebhook.secret}
                  onChange={(e) => setNewWebhook({ ...newWebhook, secret: e.target.value })}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-kelo-yellow/40 transition-shadow ${inputClasses}`}
                />
              </div>

              {/* Events */}
              <div className="space-y-3">
                <label className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-kelo-ink'}`}>
                  Events to Subscribe
                </label>
                <div className="space-y-1">
                  {availableEvents.map((event) => (
                    <div
                      key={event}
                      className={`flex items-center justify-between py-2.5 px-3 rounded-xl transition-colors ${
                        isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-kelo-surface'
                      }`}
                    >
                      <span className={`text-sm ${isDark ? 'text-white/70' : 'text-kelo-ink/80'}`}>
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

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setIsCreateDialogOpen(false)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                    isDark
                      ? 'border-white/[0.08] text-white/60 hover:bg-white/[0.04]'
                      : 'border-kelo-border text-kelo-muted hover:bg-kelo-surface'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving || !newWebhook.name.trim() || !newWebhook.url.trim()}
                  className="px-4 py-2.5 rounded-xl bg-kelo-yellow text-kelo-ink font-semibold text-sm hover:bg-kelo-yellow-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Creating...' : 'Create Webhook'}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Webhooks List */}
      <div className="space-y-3">
        {webhooks.length === 0 ? (
          <div className={`rounded-2xl border p-10 text-center ${
            isDark ? 'bg-[#111111] border-white/[0.07]' : 'bg-white border-kelo-border'
          }`}>
            {/* Webhook icon */}
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4">
              <path
                d="M24 16a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 0V6m0 36V32m-8-8H6m36 0H32m-2.34-5.66 5.66-5.66M12.68 35.32l5.66-5.66m11.32 0 5.66 5.66M12.68 12.68l5.66 5.66"
                stroke={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className={`font-semibold ${isDark ? 'text-white/60' : 'text-kelo-muted'}`}>
              No webhooks yet
            </p>
            <p className={`text-sm mt-1 ${isDark ? 'text-white/30' : 'text-kelo-muted/60'}`}>
              Create your first webhook to receive real-time notifications
            </p>
          </div>
        ) : (
          webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className={`rounded-2xl border p-4 transition-colors ${
                isDark ? 'bg-[#111111] border-white/[0.07]' : 'bg-white border-kelo-border'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  {/* Status dot */}
                  <div className="mt-1.5 shrink-0">
                    <span
                      className={`block w-2.5 h-2.5 rounded-full ${
                        webhook.is_active ? 'bg-green-500' : isDark ? 'bg-white/20' : 'bg-kelo-muted/40'
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-kelo-ink'}`}>
                        {webhook.name}
                      </h3>
                      {webhook.is_active ? (
                        <span className="text-xs font-semibold bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-lg">
                          Active
                        </span>
                      ) : (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${
                          isDark ? 'bg-white/[0.06] text-white/40' : 'bg-kelo-surface text-kelo-muted'
                        }`}>
                          Disabled
                        </span>
                      )}
                    </div>
                    <p className={`text-sm truncate max-w-md mt-0.5 ${isDark ? 'text-white/40' : 'text-kelo-muted'}`}>
                      {webhook.url}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {webhook.events?.map((event) => (
                        <span
                          key={event}
                          className="inline-flex text-xs font-medium px-2 py-0.5 rounded-lg bg-kelo-yellow/10 text-kelo-yellow-dark dark:bg-kelo-yellow/15 dark:text-kelo-yellow"
                        >
                          {EVENT_LABELS[event] || event}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {/* Toggle button */}
                  <button
                    onClick={() => handleToggle(webhook)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                      isDark ? 'text-white/50 hover:bg-white/[0.06] hover:text-white/70' : 'text-kelo-muted hover:bg-kelo-surface hover:text-kelo-ink'
                    }`}
                  >
                    {webhook.is_active ? (
                      <>
                        {/* Eye-off icon */}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                        Disable
                      </>
                    ) : (
                      <>
                        {/* Eye icon */}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        Enable
                      </>
                    )}
                  </button>
                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(webhook.id)}
                    className="inline-flex items-center p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
