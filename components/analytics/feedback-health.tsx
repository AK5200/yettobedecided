'use client'

import { useState, useEffect } from 'react'
import { Activity, AlertCircle } from 'lucide-react'

interface FeedbackHealthProps {
  orgId: string
}

export function FeedbackHealth({ orgId }: FeedbackHealthProps) {
  const [metrics, setMetrics] = useState<any>(null)
  const [stalePosts, setStalePosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch totals
        const totalsRes = await fetch(`/api/analytics?org_id=${orgId}`)
        if (totalsRes.ok) {
          const totalsJson = await totalsRes.json()
          setMetrics(totalsJson.totals)
        }

        // Fetch stale posts
        const staleRes = await fetch(`/api/analytics/stale?org_id=${orgId}`)
        if (staleRes.ok) {
          const staleJson = await staleRes.json()
          setStalePosts(staleJson.posts || [])
        }
      } catch (error) {
        console.error('Failed to fetch health data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (orgId) {
      fetchData()
    }
  }, [orgId])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
      </div>
    )
  }

  const completionRate =
    metrics && metrics.posts > 0
      ? Math.round(((metrics.completed || 0) / metrics.posts) * 100)
      : 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-green-500" />
        <h3 className="text-lg font-semibold text-gray-900">Feedback Health</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-700">{completionRate}%</div>
          <div className="text-xs text-green-600">Completion Rate</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-yellow-700">{stalePosts.length}</div>
          <div className="text-xs text-yellow-600">Stale Posts</div>
        </div>
      </div>

      {stalePosts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-yellow-800">
            <div className="font-medium mb-1">Attention Needed</div>
            <div>
              {stalePosts.length} {stalePosts.length === 1 ? 'post' : 'posts'} haven't been
              updated in over 30 days
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
