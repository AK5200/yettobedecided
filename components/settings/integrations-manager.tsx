'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Settings, ExternalLink, Unlink, Link2, Hash, Lock, Loader2 } from 'lucide-react'

type WebhookIntegrationType = 'slack' | 'discord' | 'teams' | 'telegram' | 'webhook'

interface Integration {
  id: string
  type: WebhookIntegrationType
  webhook_url: string | null
  channel_name: string | null
  access_token: string | null
  team_id: string | null
  team_name: string | null
  channel_id: string | null
  bot_user_id: string | null
  notify_on_new_feedback: boolean
  notify_on_status_change: boolean
  notify_on_new_comment: boolean
}

interface LinearIntegration {
  id: string
  org_id: string
  team_id: string | null
  team_name: string | null
  access_token: string
}

interface IntegrationsManagerProps {
  orgId: string
  initialIntegrations: Integration[]
  linearIntegration?: LinearIntegration | null
  linearAuthUrl?: string | null
}

interface IntegrationState {
  webhook_url: string
  channel_name: string
  notify_on_new_feedback: boolean
  notify_on_status_change: boolean
  notify_on_new_comment: boolean
}

interface IntegrationConfig {
  type: WebhookIntegrationType
  name: string
  description: string
  logo: React.ReactNode
  placeholder: string
  helpUrl?: string
  helpText?: string
  helperNote?: React.ReactNode
  showChannelField: boolean
}

interface SlackChannel {
  id: string
  name: string
  is_private: boolean
  type: string
}

// Slack Logo SVG
const SlackLogo = () => (
  <svg viewBox="0 0 54 54" className="w-8 h-8">
    <g fill="none" fillRule="evenodd">
      <path
        fill="#36C5F0"
        d="M19.712.133a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386h5.376V5.52A5.381 5.381 0 0 0 19.712.133m0 14.365H5.376A5.381 5.381 0 0 0 0 19.884a5.381 5.381 0 0 0 5.376 5.387h14.336a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386"
      />
      <path
        fill="#2EB67D"
        d="M53.76 19.884a5.381 5.381 0 0 0-5.376-5.386 5.381 5.381 0 0 0-5.376 5.386v5.387h5.376a5.381 5.381 0 0 0 5.376-5.387m-14.336 0V5.52A5.381 5.381 0 0 0 34.048.133a5.381 5.381 0 0 0-5.376 5.387v14.364a5.381 5.381 0 0 0 5.376 5.387 5.381 5.381 0 0 0 5.376-5.387"
      />
      <path
        fill="#ECB22E"
        d="M34.048 54a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386h-5.376v5.386A5.381 5.381 0 0 0 34.048 54m0-14.365h14.336a5.381 5.381 0 0 0 5.376-5.386 5.381 5.381 0 0 0-5.376-5.387H34.048a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386"
      />
      <path
        fill="#E01E5A"
        d="M0 34.249a5.381 5.381 0 0 0 5.376 5.386 5.381 5.381 0 0 0 5.376-5.386v-5.387H5.376A5.381 5.381 0 0 0 0 34.25m14.336-.001v14.364A5.381 5.381 0 0 0 19.712 54a5.381 5.381 0 0 0 5.376-5.387V34.249a5.381 5.381 0 0 0-5.376-5.387 5.381 5.381 0 0 0-5.376 5.387"
      />
    </g>
  </svg>
)

// Discord Logo SVG
const DiscordLogo = () => (
  <div className="w-8 h-8 rounded bg-[#5865F2] flex items-center justify-center">
    <svg viewBox="0 0 71 55" className="w-5 h-5">
      <path
        fill="white"
        d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9056 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6305 45.5858C52.8618 46.6197 51.0231 47.4931 49.0893 48.2228C48.9634 48.2707 48.9074 48.4172 48.969 48.5383C50.0366 50.6034 51.254 52.57 52.5765 54.435C52.6325 54.5139 52.7333 54.5477 52.8257 54.5195C58.6319 52.7249 64.5145 50.0174 70.5874 45.5576C70.6406 45.5182 70.6742 45.459 70.6798 45.3942C72.1559 30.0791 68.2029 16.7757 60.2353 4.9823C60.2157 4.9429 60.1821 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"
      />
    </svg>
  </div>
)

// Teams Logo
const TeamsLogo = () => (
  <div className="w-8 h-8 rounded bg-[#6264A7] flex items-center justify-center">
    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.2 6.4C19.2 7.72548 18.1255 8.8 16.8 8.8C15.4745 8.8 14.4 7.72548 14.4 6.4C14.4 5.07452 15.4745 4 16.8 4C18.1255 4 19.2 5.07452 19.2 6.4ZM22.4 9.6H17.6C17.6 9.6 17.6 9.6 17.6 9.6H17.4568C17.7926 10.1534 18 10.7912 18 11.48V16.4C18 16.5788 17.9872 16.7544 17.9626 16.9262C17.9744 16.926 17.9862 16.926 17.998 16.926L18 16.926H22.4C23.2837 16.926 24 16.2097 24 15.326V11.2C24 10.3163 23.2837 9.6 22.4 9.6ZM12 4C13.7673 4 15.2 5.43269 15.2 7.2C15.2 8.96731 13.7673 10.4 12 10.4C10.2327 10.4 8.8 8.96731 8.8 7.2C8.8 5.43269 10.2327 4 12 4ZM16.4 11.48V16.4C16.4 17.8359 15.6934 19.1062 14.58 19.87C14.5197 19.9113 14.4577 19.9508 14.394 19.9883L14.3926 19.9891C13.6889 20.4019 12.8717 20.64 12 20.64C11.1283 20.64 10.3111 20.4019 9.60738 19.9891L9.606 19.9883C9.54232 19.9508 9.48027 19.9113 9.42 19.87C8.30664 19.1062 7.6 17.8359 7.6 16.4V11.48C7.6 10.4422 8.44222 9.6 9.48 9.6H14.52C15.5578 9.6 16.4 10.4422 16.4 11.48ZM6 16.4V11.48C6 10.7912 6.20744 10.1534 6.54321 9.6H6.4H1.6C0.716344 9.6 0 10.3163 0 11.2V15.326C0 16.2097 0.716345 16.926 1.6 16.926H6.002L6.004 16.926C6.01577 16.926 6.02765 16.926 6.03741 16.9262C6.01277 16.7544 6 16.5788 6 16.4ZM7.2 8.8C8.52548 8.8 9.6 7.72548 9.6 6.4C9.6 5.07452 8.52548 4 7.2 4C5.87452 4 4.8 5.07452 4.8 6.4C4.8 7.72548 5.87452 8.8 7.2 8.8Z" />
    </svg>
  </div>
)

// Telegram Logo
const TelegramLogo = () => (
  <div className="w-8 h-8 rounded bg-[#0088cc] flex items-center justify-center">
    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.05-.2s-.16-.05-.23-.03c-.1.03-1.62 1.03-4.58 3.03-.43.3-.82.44-1.17.43-.39-.01-1.13-.22-1.68-.4-.68-.22-1.22-.34-1.17-.72.02-.2.31-.4.87-.6 3.45-1.5 5.75-2.49 6.9-2.98 3.29-1.37 3.97-1.6 4.42-1.61.1 0 .32.02.46.13.12.09.15.21.17.3-.01.06.01.24 0 .37z" />
    </svg>
  </div>
)

// Webhook Logo
const WebhookLogo = () => (
  <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center">
    <Link2 className="w-5 h-5 text-white" />
  </div>
)

// Linear Logo SVG
const LinearLogo = () => (
  <svg viewBox="0 0 100 100" className="w-8 h-8">
    <path
      fill="#5E6AD2"
      d="M1.22541 61.5228c-.2225-.9485.90748-1.5459 1.59638-.857L39.3342 97.1782c.6889.6889.0915 1.8189-.857 1.5765-11.0629-2.8283-20.7172-9.6571-27.0716-18.9581L1.22541 61.5228zM.00189135 46.8891c-.01764375.2833.00624.5666.07221.8471L23.0248 66.5556c.2106.1439.4601.2188.7154.2146l22.8082-.3745c.7768-.0127 1.1486-.9507.5966-1.5026L3.48006 21.2272c-.55203-.5519-1.48997-.1801-1.5027.5965l-.37485 22.8073c-.00415.2553.07078.5048.21458.7152l2.18573 3.202c.07504.0895.12607.195.14959.3086.02353.1137.01938.2314-.01214.3447-.03153.1133-.09008.2173-.17159.3046-.08152.0874-.18305.1554-.29753.1993-.11448.0439-.23758.0624-.36086.054-.12328-.0083-.24211-.0434-.34818-.1026-.10607-.0591-.19734-.1407-.26742-.2392l-.4724-.6633c-.21313-.2862-.53766-.4654-.89175-.4919L.00189135 46.8891z"
    />
  </svg>
)

// Webhook-only configs (Slack is handled separately with OAuth)
const WEBHOOK_CONFIGS: IntegrationConfig[] = [
  {
    type: 'discord',
    name: 'Discord',
    description: 'Get notified about new feedback and updates in Discord',
    logo: <DiscordLogo />,
    placeholder: 'https://discord.com/api/webhooks/...',
    helpUrl: 'https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks',
    helpText: 'Learn how to create a webhook',
    showChannelField: true,
  },
  {
    type: 'teams',
    name: 'Microsoft Teams',
    description: 'Get notified in Teams channels',
    logo: <TeamsLogo />,
    placeholder: 'https://outlook.office.com/webhook/...',
    helpUrl: 'https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook',
    helpText: 'Learn how to create an Incoming Webhook',
    showChannelField: true,
  },
  {
    type: 'telegram',
    name: 'Telegram',
    description: 'Get notified in Telegram groups',
    logo: <TelegramLogo />,
    placeholder: 'https://api.telegram.org/bot<TOKEN>/sendMessage?chat_id=<CHAT_ID>',
    helpUrl: 'https://core.telegram.org/bots#how-do-i-create-a-bot',
    helpText: 'Learn how to create a Telegram bot',
    helperNote: (
      <p className="text-xs text-gray-500 mt-1">
        Format: https://api.telegram.org/bot&lt;TOKEN&gt;/sendMessage?chat_id=&lt;CHAT_ID&gt;
      </p>
    ),
    showChannelField: false,
  },
  {
    type: 'webhook',
    name: 'Webhook',
    description: 'Send events to any URL (Zapier, Make, n8n, etc.)',
    logo: <WebhookLogo />,
    placeholder: 'https://your-endpoint.com/webhook',
    helperNote: (
      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded font-mono mt-1">
        {'{ "event": "...", "timestamp": "...", "data": { "title": "...", ... } }'}
      </div>
    ),
    showChannelField: false,
  },
]

function getDefaultState(existing?: Integration): IntegrationState {
  return {
    webhook_url: existing?.webhook_url || '',
    channel_name: existing?.channel_name || '',
    notify_on_new_feedback: existing?.notify_on_new_feedback ?? true,
    notify_on_status_change: existing?.notify_on_status_change ?? true,
    notify_on_new_comment: existing?.notify_on_new_comment ?? false,
  }
}

export function IntegrationsManager({
  orgId,
  initialIntegrations,
  linearIntegration,
  linearAuthUrl,
}: IntegrationsManagerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Slack OAuth state
  const slackIntegration = initialIntegrations.find((i) => i.type === 'slack')
  const slackOAuthConnected = !!(slackIntegration?.access_token)
  const [slackChannels, setSlackChannels] = useState<SlackChannel[]>([])
  const [loadingChannels, setLoadingChannels] = useState(false)
  const [slackChannel, setSlackChannel] = useState(slackIntegration?.channel_id || '')
  const [slackNotify, setSlackNotify] = useState({
    notify_on_new_feedback: slackIntegration?.notify_on_new_feedback ?? true,
    notify_on_status_change: slackIntegration?.notify_on_status_change ?? true,
    notify_on_new_comment: slackIntegration?.notify_on_new_comment ?? false,
  })
  const [savingSlack, setSavingSlack] = useState(false)
  const [disconnectingSlack, setDisconnectingSlack] = useState(false)

  // Webhook-based integrations state
  const [states, setStates] = useState<Record<string, IntegrationState>>(() => {
    const findIntegration = (type: WebhookIntegrationType) =>
      initialIntegrations.find((i) => i.type === type)
    const result: Record<string, IntegrationState> = {}
    for (const config of WEBHOOK_CONFIGS) {
      result[config.type] = getDefaultState(findIntegration(config.type))
    }
    return result
  })

  const [saving, setSaving] = useState(false)
  const [configuring, setConfiguring] = useState<WebhookIntegrationType | null>(null)

  // Show toast on OAuth callback
  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    if (success === 'slack_connected') {
      toast.success('Slack connected successfully!')
      // Clean URL
      window.history.replaceState({}, '', '/settings/integrations')
    } else if (error === 'slack_denied') {
      toast.error('Slack authorization was denied')
      window.history.replaceState({}, '', '/settings/integrations')
    } else if (error) {
      toast.error(`Connection failed: ${error.replace(/_/g, ' ')}`)
      window.history.replaceState({}, '', '/settings/integrations')
    }
  }, [searchParams])

  // Slack OAuth actions
  const handleSlackConnect = () => {
    window.location.href = `/api/auth/slack?org_id=${orgId}`
  }

  const handleSlackDisconnect = async () => {
    setDisconnectingSlack(true)
    const response = await fetch('/api/integrations/slack/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: orgId }),
    })
    if (response.ok) {
      toast.success('Slack disconnected')
      router.refresh()
    } else {
      toast.error('Failed to disconnect Slack')
    }
    setDisconnectingSlack(false)
  }

  const fetchSlackChannels = async () => {
    setLoadingChannels(true)
    const res = await fetch(`/api/integrations/slack/channels?org_id=${orgId}`)
    if (res.ok) {
      const data = await res.json()
      setSlackChannels(data.channels)
    }
    setLoadingChannels(false)
  }

  const handleChannelChange = async (channelId: string) => {
    const channel = slackChannels.find((c) => c.id === channelId)
    setSlackChannel(channelId)
    await fetch('/api/integrations/slack/channel', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        org_id: orgId,
        channel_id: channelId,
        channel_name: channel?.name || null,
      }),
    })
    toast.success(`Channel set to #${channel?.name}`)
  }

  const saveSlackNotifications = async () => {
    setSavingSlack(true)
    const response = await fetch('/api/integrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        org_id: orgId,
        type: 'slack',
        ...slackNotify,
      }),
    })
    if (response.ok) {
      toast.success('Slack notification settings saved!')
    } else {
      toast.error('Failed to save settings')
    }
    setSavingSlack(false)
  }

  // Webhook-based integration actions
  const updateState = (type: string, updates: Partial<IntegrationState>) => {
    setStates((prev) => ({
      ...prev,
      [type]: { ...prev[type], ...updates },
    }))
  }

  const saveIntegration = async (type: WebhookIntegrationType) => {
    setSaving(true)
    const payload = states[type]
    const response = await fetch('/api/integrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: orgId, type, ...payload }),
    })
    if (!response.ok) {
      const errorData = await response.json()
      toast.error(errorData.error || 'Failed to save integration.')
      setSaving(false)
      return
    }
    const config = WEBHOOK_CONFIGS.find((c) => c.type === type)
    toast.success(`${config?.name || type} integration saved!`)
    setSaving(false)
    setConfiguring(null)
  }

  const isConnected = (type: string) => !!states[type]?.webhook_url

  const activeConfig = configuring
    ? WEBHOOK_CONFIGS.find((c) => c.type === configuring)
    : null

  return (
    <div className="space-y-4">
      {/* Slack OAuth Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-white border flex items-center justify-center">
              <SlackLogo />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                Slack
                {slackOAuthConnected && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    Connected
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-500">
                {slackOAuthConnected
                  ? `Connected to ${slackIntegration?.team_name || 'Slack'}`
                  : 'Get notified about new feedback and updates in Slack'}
              </p>
            </div>
          </div>
          {slackOAuthConnected ? (
            <Button
              variant="outline"
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleSlackDisconnect}
              disabled={disconnectingSlack}
            >
              <Unlink className="h-4 w-4" />
              {disconnectingSlack ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          ) : (
            <Button
              className="gap-2 bg-[#4A154B] hover:bg-[#3a1139] text-white"
              onClick={handleSlackConnect}
            >
              <SlackLogo />
              Add to Slack
            </Button>
          )}
        </div>

        {/* Slack Connected Settings */}
        {slackOAuthConnected && (
          <div className="mt-6 pt-6 border-t space-y-5">
            {/* Channel Selector */}
            <div className="space-y-2">
              <Label>Channel</Label>
              <Select
                value={slackChannel}
                onValueChange={handleChannelChange}
                onOpenChange={(open) => { if (open) fetchSlackChannels() }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a channel">
                    {slackChannel
                      ? `# ${slackIntegration?.channel_name || slackChannels.find(c => c.id === slackChannel)?.name || slackChannel}`
                      : 'Select a channel'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {loadingChannels ? (
                    <div className="flex items-center justify-center py-4 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading channels...
                    </div>
                  ) : (
                    slackChannels.map((channel) => (
                      <SelectItem key={channel.id} value={channel.id}>
                        <span className="flex items-center gap-1.5">
                          {channel.is_private ? (
                            <Lock className="h-3 w-3 text-gray-400" />
                          ) : (
                            <Hash className="h-3 w-3 text-gray-400" />
                          )}
                          {channel.name}
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Notification Toggles */}
            <div className="space-y-3">
              <Label>Notification Events</Label>

              <div className="flex items-center justify-between py-1.5">
                <div>
                  <p className="text-sm font-medium text-gray-900">New Feedback</p>
                  <p className="text-xs text-gray-500">When someone submits new feedback</p>
                </div>
                <Switch
                  checked={slackNotify.notify_on_new_feedback}
                  onCheckedChange={(checked) =>
                    setSlackNotify((prev) => ({ ...prev, notify_on_new_feedback: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between py-1.5">
                <div>
                  <p className="text-sm font-medium text-gray-900">Status Changes</p>
                  <p className="text-xs text-gray-500">When feedback status is updated</p>
                </div>
                <Switch
                  checked={slackNotify.notify_on_status_change}
                  onCheckedChange={(checked) =>
                    setSlackNotify((prev) => ({ ...prev, notify_on_status_change: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between py-1.5">
                <div>
                  <p className="text-sm font-medium text-gray-900">New Comments</p>
                  <p className="text-xs text-gray-500">When someone comments on feedback</p>
                </div>
                <Switch
                  checked={slackNotify.notify_on_new_comment}
                  onCheckedChange={(checked) =>
                    setSlackNotify((prev) => ({ ...prev, notify_on_new_comment: checked }))
                  }
                />
              </div>
            </div>

            <Button
              onClick={saveSlackNotifications}
              disabled={savingSlack}
              className="bg-amber-500 hover:bg-amber-600 text-white"
              size="sm"
            >
              {savingSlack ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        )}
      </Card>

      {/* Webhook-based integration cards */}
      {WEBHOOK_CONFIGS.map((config) => (
        <Card key={config.type} className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-white border flex items-center justify-center">
                {config.logo}
              </div>
              <div>
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  {config.name}
                  {isConnected(config.type) && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      Connected
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-500">{config.description}</p>
              </div>
            </div>
            <Button
              className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => setConfiguring(config.type)}
            >
              <Settings className="h-4 w-4" />
              Configure
            </Button>
          </div>
        </Card>
      ))}

      {/* Webhook Configuration Dialog */}
      <Dialog
        open={configuring !== null}
        onOpenChange={(open) => { if (!open) setConfiguring(null) }}
      >
        <DialogContent className="max-w-md">
          {activeConfig && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {activeConfig.logo}
                  Configure {activeConfig.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label htmlFor={`${activeConfig.type}-webhook`}>Webhook URL</Label>
                  <Input
                    id={`${activeConfig.type}-webhook`}
                    placeholder={activeConfig.placeholder}
                    value={states[activeConfig.type].webhook_url}
                    onChange={(e) => updateState(activeConfig.type, { webhook_url: e.target.value })}
                  />
                  {activeConfig.helpUrl && (
                    <a
                      href={activeConfig.helpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1"
                    >
                      {activeConfig.helpText} <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {activeConfig.helperNote}
                </div>

                {activeConfig.showChannelField && (
                  <div className="space-y-2">
                    <Label htmlFor={`${activeConfig.type}-channel`}>Channel Name (optional)</Label>
                    <Input
                      id={`${activeConfig.type}-channel`}
                      placeholder="#feedback"
                      value={states[activeConfig.type].channel_name}
                      onChange={(e) =>
                        updateState(activeConfig.type, { channel_name: e.target.value })
                      }
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <Label>Notification Events</Label>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">New Feedback</p>
                      <p className="text-xs text-gray-500">When someone submits new feedback</p>
                    </div>
                    <Switch
                      checked={states[activeConfig.type].notify_on_new_feedback}
                      onCheckedChange={(checked) =>
                        updateState(activeConfig.type, { notify_on_new_feedback: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Status Changes</p>
                      <p className="text-xs text-gray-500">When feedback status is updated</p>
                    </div>
                    <Switch
                      checked={states[activeConfig.type].notify_on_status_change}
                      onCheckedChange={(checked) =>
                        updateState(activeConfig.type, { notify_on_status_change: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">New Comments</p>
                      <p className="text-xs text-gray-500">When someone comments on feedback</p>
                    </div>
                    <Switch
                      checked={states[activeConfig.type].notify_on_new_comment}
                      onCheckedChange={(checked) =>
                        updateState(activeConfig.type, { notify_on_new_comment: checked })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setConfiguring(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => saveIntegration(activeConfig.type)}
                    disabled={saving}
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Linear Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-white border flex items-center justify-center">
              <LinearLogo />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                Linear
                {linearIntegration && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    Connected
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-500">
                {linearIntegration
                  ? `Connected to ${linearIntegration.team_name || 'Linear'}`
                  : 'Sync feedback with Linear issues for seamless tracking'}
              </p>
            </div>
          </div>
          {linearIntegration ? (
            <Button
              variant="outline"
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={async () => {
                const response = await fetch(`/api/linear/disconnect`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ org_id: orgId }),
                })
                if (response.ok) {
                  toast.success('Linear disconnected')
                  router.refresh()
                } else {
                  toast.error('Failed to disconnect Linear')
                }
              }}
            >
              <Unlink className="h-4 w-4" />
              Disconnect
            </Button>
          ) : linearAuthUrl ? (
            <Button
              className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => window.location.href = linearAuthUrl}
            >
              <ExternalLink className="h-4 w-4" />
              Connect
            </Button>
          ) : (
            <Button disabled className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Connect
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
