'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface NeedsAttentionProps {
  orgId: string
}

export function NeedsAttention({ orgId }: NeedsAttentionProps) {
  const [dismissed, setDismissed] = useState(false)
  const [data, setData] = useState<{ stale: number; pending: number }>({ stale: 0, pending: 0 })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/analytics/stale?org_id=${orgId}`)
        if (res.ok) {
          const json = await res.json()
          setData({ stale: json.posts?.length || 0, pending: 0 })
        }
      } catch (error) {
        console.error('Failed to fetch stale posts:', error)
      }
    }

    if (orgId) {
      fetchData()
    }
  }, [orgId])

  if (dismissed || (data.stale === 0 && data.pending === 0)) {
    return null
  }

  return (
    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600" />
        <div>
          <p className="text-sm font-medium text-amber-900">
            {data.stale} {data.stale === 1 ? 'post' : 'posts'} need attention
          </p>
          <p className="text-xs text-amber-700">
            Some posts haven't been updated in over 30 days
          </p>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 hover:bg-amber-100 rounded-md transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4 text-amber-600" />
      </button>
    </div>
  )
}
