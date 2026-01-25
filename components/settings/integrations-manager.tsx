'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

type IntegrationType = 'slack' | 'discord'

interface Integration {
  id: string
  type: IntegrationType
  webhook_url: string | null
  channel_name: string | null
  notify_on_new_feedback: boolean
  notify_on_status_change: boolean
  notify_on_new_comment: boolean
}

interface IntegrationsManagerProps {
  orgId: string
  initialIntegrations: Integration[]
}

export function IntegrationsManager({ orgId, initialIntegrations }: IntegrationsManagerProps) {
  const findIntegration = (type: IntegrationType) =>
    initialIntegrations.find((i) => i.type === type)

  const [slack, setSlack] = useState(() => ({
    webhook_url: findIntegration('slack')?.webhook_url || '',
    channel_name: findIntegration('slack')?.channel_name || '',
    notify_on_new_feedback: findIntegration('slack')?.notify_on_new_feedback ?? true,
    notify_on_status_change: findIntegration('slack')?.notify_on_status_change ?? true,
    notify_on_new_comment: findIntegration('slack')?.notify_on_new_comment ?? false,
  }))

  const [discord, setDiscord] = useState(() => ({
    webhook_url: findIntegration('discord')?.webhook_url || '',
    channel_name: findIntegration('discord')?.channel_name || '',
    notify_on_new_feedback: findIntegration('discord')?.notify_on_new_feedback ?? true,
    notify_on_status_change: findIntegration('discord')?.notify_on_status_change ?? true,
    notify_on_new_comment: findIntegration('discord')?.notify_on_new_comment ?? false,
  }))

  const saveIntegration = async (type: IntegrationType) => {
    const payload = type === 'slack' ? slack : discord
    const response = await fetch('/api/integrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: orgId, type, ...payload }),
    })
    if (!response.ok) {
      const errorData = await response.json()
      toast.error(errorData.error || 'Failed to save integration.')
      return
    }
    toast.success(`${type === 'slack' ? 'Slack' : 'Discord'} integration saved.`)
  }

  const renderCard = (type: IntegrationType) => {
    const state = type === 'slack' ? slack : discord
    const setState = type === 'slack' ? setSlack : setDiscord
    const label = type === 'slack' ? 'Slack' : 'Discord'

    return (
      <div className="border rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold">{label}</h2>
        <div className="space-y-2">
          <Label htmlFor={`${type}-webhook`}>Webhook URL</Label>
          <Input
            id={`${type}-webhook`}
            value={state.webhook_url}
            onChange={(e) => setState((prev) => ({ ...prev, webhook_url: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${type}-channel`}>Channel Name (optional)</Label>
          <Input
            id={`${type}-channel`}
            value={state.channel_name}
            onChange={(e) => setState((prev) => ({ ...prev, channel_name: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Notifications</Label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={state.notify_on_new_feedback}
                onCheckedChange={(value) =>
                  setState((prev) => ({ ...prev, notify_on_new_feedback: Boolean(value) }))
                }
              />
              New feedback
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={state.notify_on_status_change}
                onCheckedChange={(value) =>
                  setState((prev) => ({ ...prev, notify_on_status_change: Boolean(value) }))
                }
              />
              Status change
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={state.notify_on_new_comment}
                onCheckedChange={(value) =>
                  setState((prev) => ({ ...prev, notify_on_new_comment: Boolean(value) }))
                }
              />
              New comment
            </label>
          </div>
        </div>
        <Button onClick={() => saveIntegration(type)}>Save {label} Settings</Button>
      </div>
    )
  }

  return <div className="grid gap-6 md:grid-cols-2">{renderCard('slack')}{renderCard('discord')}</div>
}
