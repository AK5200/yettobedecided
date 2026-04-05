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

function getCategoryColor(category: string | null): { bg: string; text: string; dot: string } {
  switch (category?.toLowerCase()) {
    case 'feature':
      return { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' }
    case 'improvement':
      return { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' }
    case 'fix':
      return { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' }
    default:
      return { bg: 'bg-slate-50 dark:bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400', dot: 'bg-slate-400' }
  }
}

export function ChangelogPopup({
  orgSlug,
  accentColor = '#000',
  backgroundColor,
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
      className="h-full flex flex-col overflow-hidden bg-white dark:bg-[#1a1a1a]"
      style={{ backgroundColor: backgroundColor || undefined, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* Header */}
      <div
        className="px-6 pt-6 pb-5 border-b border-border/60 dark:border-white/10 shrink-0"
        style={{ backgroundColor: headerBackgroundColor || backgroundColor || undefined }}
      >
        <div className="flex items-start justify-between mb-1.5">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{heading}</h1>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{subheading}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-muted/80 dark:hover:bg-white/10 transition-all duration-200 -mr-1 -mt-1"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-muted-foreground text-sm">No updates yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {entries.map((entry) => {
              const catColor = getCategoryColor(entry.category)
              return (
                <div
                  key={entry.id}
                  className="py-5 border-b border-border/40 dark:border-white/6 last:border-0 group"
                >
                  <div className="flex items-center gap-2.5 mb-2.5">
                    {entry.category && (
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${catColor.bg} ${catColor.text}`}
                      >
                        {entry.category}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground/70">
                      {formatDate(entry.published_at || entry.created_at)}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2 leading-snug">{entry.title}</h3>
                  {entry.content && (
                    <div
                      className="text-sm text-muted-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none [&_img]:rounded-xl [&_img]:my-3 [&_img]:shadow-sm [&_a]:underline [&_a]:decoration-muted-foreground/30 [&_a]:underline-offset-2"
                      dangerouslySetInnerHTML={{ __html: entry.content }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3.5 border-t border-border/60 dark:border-white/10 shrink-0 flex items-center justify-between">
        {showBranding ? (
          <span className="text-xs text-muted-foreground/40 font-medium">Powered by Kelo</span>
        ) : <span />}
        <a
          href={`/${orgSlug}/changelog`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold hover:underline underline-offset-2 transition-all duration-200"
          style={{ color: accentColor }}
        >
          View all updates &rarr;
        </a>
      </div>
    </div>
  )
}
