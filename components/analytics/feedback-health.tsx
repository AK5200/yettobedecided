'use client'

import { useState, useEffect } from 'react'
import { Activity, AlertCircle, CheckCircle2, Clock } from 'lucide-react'

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
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />
      </div>
    )
  }

  const completionRate =
    metrics && metrics.posts > 0
      ? Math.round(((metrics.completed || 0) / metrics.posts) * 100)
      : 0

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 rounded-xl">
          <Activity className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Feedback Health</h3>
          <p className="text-sm text-gray-500">System status overview</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">
              Completion
            </span>
          </div>
          <div className="text-3xl font-bold text-green-700">{completionRate}%</div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-amber-600" />
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Stale
            </span>
          </div>
          <div className="text-3xl font-bold text-amber-700">{stalePosts.length}</div>
        </div>
      </div>

      {stalePosts.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-xl p-4 flex items-start gap-3 shadow-sm">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-semibold text-amber-900 mb-1 text-sm">Attention Needed</div>
            <div className="text-xs text-amber-800">
              {stalePosts.length} {stalePosts.length === 1 ? 'post' : 'posts'} haven't been
              updated in over 30 days
            </div>
          </div>
        </div>
      )}

      {stalePosts.length === 0 && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 text-center">
          <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <div className="text-sm font-semibold text-green-900">All systems healthy</div>
          <div className="text-xs text-green-700 mt-1">No stale posts detected</div>
        </div>
      )}
    </div>
  )
}
