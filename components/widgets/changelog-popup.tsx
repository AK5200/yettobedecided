'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface ChangelogEntry {
  id: string
  title: string
  content: string
  category: string | null
  published_at: string
  created_at: string
}

interface ChangelogPopupProps {
  orgSlug: string
  accentColor?: string
  backgroundColor?: string
  headerBackgroundColor?: string
  borderRadius?: string
  showBranding?: boolean
  heading?: string
  subheading?: string
}

export function ChangelogPopup({
  orgSlug,
  accentColor = '#000',
  backgroundColor = '#ffffff',
  headerBackgroundColor,
  showBranding = true,
  heading = "What's New",
  subheading = "Latest updates and improvements.",
}: ChangelogPopupProps) {
  const [entries, setEntries] = useState<ChangelogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/changelog?org=${encodeURIComponent(orgSlug)}&limit=10&published_only=true`)
      .then(res => res.json())
      .then(data => {
        setEntries(data.entries || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [orgSlug])

  const handleClose = () => {
    window.parent.postMessage('kelo:close-changelog', '*')
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{ backgroundColor, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b shrink-0" style={{ backgroundColor: headerBackgroundColor || backgroundColor }}>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold text-foreground">{heading}</h1>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">{subheading}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No updates yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {entries.map(entry => (
              <div key={entry.id} className="pb-6 border-b last:border-0">
                <div className="flex items-center gap-2 mb-2">
                  {entry.category && (
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                      style={{ background: accentColor }}
                    >
                      {entry.category}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatDate(entry.published_at || entry.created_at)}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground mb-1">{entry.title}</h3>
                {entry.content && (
                  <div
                    className="text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none [&_img]:rounded-lg [&_img]:my-2"
                    dangerouslySetInnerHTML={{ __html: entry.content }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t shrink-0 flex items-center justify-between">
        {showBranding ? (
          <span className="text-xs text-muted-foreground/50">Powered by Kelo</span>
        ) : <span />}
        <a
          href={`/${orgSlug}/changelog`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold hover:underline"
          style={{ color: accentColor }}
        >
          View all updates →
        </a>
      </div>
    </div>
  )
}
