'use client'

import { useState, useEffect } from 'react'

interface ChangelogEntry {
  id: string
  title: string
  content: string
  category: string | null
  published_at: string
  created_at: string
}

interface ChangelogDropdownProps {
  orgSlug: string
  accentColor?: string
  backgroundColor?: string
  borderRadius?: string
  showBranding?: boolean
}

function getCategoryColor(category: string | null): string {
  switch (category?.toLowerCase()) {
    case 'feature':
      return 'bg-emerald-500'
    case 'improvement':
      return 'bg-blue-500'
    case 'fix':
      return 'bg-amber-500'
    default:
      return 'bg-slate-400'
  }
}

export function ChangelogDropdown({
  orgSlug,
  accentColor = '#000',
  backgroundColor,
  showBranding = true,
}: ChangelogDropdownProps) {
  const [entries, setEntries] = useState<ChangelogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/changelog?org=${encodeURIComponent(orgSlug)}&limit=5&published_only=true`)
      .then(res => res.json())
      .then(data => {
        setEntries(data.entries || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [orgSlug])

  // Report height to parent so iframe can auto-size (capped at 500 on parent side)
  useEffect(() => {
    const reportHeight = () => {
      // Report natural content height — parent caps at 500px
      const height = document.body.scrollHeight
      window.parent.postMessage({ type: 'kelo:resize', height: height }, '*')
    }
    const timer = setTimeout(reportHeight, 150)
    return () => clearTimeout(timer)
  }, [entries, loading])

  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div
      className="h-screen flex flex-col overflow-hidden bg-white dark:bg-[#1a1a1a]"
      style={{ backgroundColor: backgroundColor || undefined, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border/60 dark:border-white/10 shrink-0">
        <h2 className="font-semibold text-sm text-foreground tracking-tight">Latest Updates</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-10 px-4">
            <p className="text-xs text-muted-foreground">No updates yet.</p>
          </div>
        ) : (
          <div>
            {entries.map(entry => (
              <div
                key={entry.id}
                className="px-4 py-3.5 border-b border-border/40 dark:border-white/6 last:border-0 transition-all duration-200 hover:bg-muted/40 dark:hover:bg-white/3"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  {entry.category && (
                    <span className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${getCategoryColor(entry.category)}`} />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                        {entry.category}
                      </span>
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground/50 ml-auto">
                    {formatDate(entry.published_at || entry.created_at)}
                  </span>
                </div>
                <h4 className="font-medium text-sm text-foreground leading-snug">{entry.title}</h4>
                {entry.content && (
                  <div
                    className="text-xs text-muted-foreground/70 mt-1 line-clamp-2 leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: entry.content }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-border/60 dark:border-white/10 shrink-0 flex items-center justify-between">
        {showBranding ? (
          <span className="text-[10px] text-muted-foreground/40 font-medium">Powered by Kelo</span>
        ) : <span />}
        <a
          href={`/${orgSlug}/changelog`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-semibold hover:underline underline-offset-2 transition-all duration-200"
          style={{ color: accentColor }}
        >
          View all &rarr;
        </a>
      </div>
    </div>
  )
}
