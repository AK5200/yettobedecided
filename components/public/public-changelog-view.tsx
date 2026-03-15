'use client'

import { useState } from 'react'
import { PublicHubNav } from '@/components/public/public-hub-nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bell, Sparkles, Wrench, Zap, BookOpen } from 'lucide-react'
import type { ChangelogEntry, Organization } from '@/lib/types/database'

interface PublicChangelogViewProps {
  org: Organization
  orgSlug: string
  entries: ChangelogEntry[]
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof Sparkles; color: string; bg: string }> = {
  feature: { label: 'Feature', icon: Sparkles, color: 'text-violet-700', bg: 'bg-violet-50' },
  improvement: { label: 'Improvement', icon: Zap, color: 'text-blue-700', bg: 'bg-blue-50' },
  fix: { label: 'Fix', icon: Wrench, color: 'text-amber-700', bg: 'bg-amber-50' },
}

function formatDate(dateString: string | null) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function SubscribeForm({ orgId }: { orgId: string }) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [subscribed, setSubscribed] = useState(false)

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
      setSubscribed(true)
      setMessage('Subscribed! Check your email to confirm.')
      setEmail('')
    }

    setLoading(false)
  }

  if (subscribed) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-4 py-3 rounded-lg">
        <Bell className="h-4 w-4" />
        <span>{message}</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-10 rounded-lg border-gray-200 bg-white text-sm flex-1 max-w-xs placeholder:text-gray-400"
        />
        <Button
          type="submit"
          disabled={loading}
          className="h-10 px-4 bg-linear-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 rounded-lg text-sm font-semibold shadow-sm border border-yellow-400/50"
        >
          <Bell className="h-3.5 w-3.5 mr-1.5" />
          {loading ? 'Subscribing...' : 'Subscribe'}
        </Button>
      </div>
      {message && !subscribed && (
        <p className="text-sm text-red-600 mt-2">{message}</p>
      )}
    </form>
  )
}

export function PublicChangelogView({ org, orgSlug, entries }: PublicChangelogViewProps) {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <PublicHubNav org={org} orgSlug={orgSlug} />

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Changelog</h1>
          <p className="text-sm text-gray-500 mt-1 mb-5">
            Stay up to date with the latest updates
          </p>
          <SubscribeForm orgId={org.id} />
        </div>

        {/* Entries */}
        {entries.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-sm font-medium text-gray-900">No updates yet</p>
            <p className="text-sm text-gray-500 mt-1">Subscribe to get notified when we ship</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[7px] top-2 bottom-0 w-px bg-linear-to-b from-yellow-300 via-gray-200 to-gray-200" />

            <div className="space-y-10">
              {entries.map((entry, index) => {
                const config = CATEGORY_CONFIG[entry.category] || CATEGORY_CONFIG.feature
                const Icon = config.icon

                return (
                  <div key={entry.id} className="relative pl-8">
                    {/* Timeline dot */}
                    <div
                      className="absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full bg-white border-2 z-10"
                      style={{ borderColor: index === 0 ? '#FACC15' : '#D1D5DB' }}
                    />

                    {/* Date */}
                    <time className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      {formatDate(entry.published_at)}
                    </time>

                    {/* Card */}
                    <div className="mt-2 bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-sm transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${config.bg} ${config.color}`}>
                          <Icon className="h-3 w-3" />
                          {config.label}
                        </span>
                      </div>

                      <h2 className="text-base font-semibold text-gray-900 leading-snug mb-2">
                        {entry.title}
                      </h2>

                      <div
                        className="prose prose-sm max-w-none text-gray-600 leading-relaxed [&_a]:text-gray-600 [&_a]:underline [&_a]:decoration-gray-400 hover:[&_a]:decoration-gray-600 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg"
                        dangerouslySetInnerHTML={{ __html: entry.content }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Branding footer */}
        {org.show_branding && (
          <div className="mt-16 pb-8 text-center">
            <span className="text-xs text-gray-400">
              Powered by{' '}
              <a
                href="https://kelohq.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                Kelo
              </a>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
