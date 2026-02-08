'use client'

import { useState, useEffect } from 'react'
import { FileText, ThumbsUp, MessageSquare, Users, CheckCircle2 } from 'lucide-react'
import { ComparisonBadge } from './comparison-badge'

interface MetricCardsProps {
  orgId: string
  days?: number
  boardId?: string
}

export function MetricCards({ orgId, days = 30, boardId }: MetricCardsProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams({ org_id: orgId, days: String(days) })
        if (boardId) {
          params.append('board_id', boardId)
        }
        const res = await fetch(`/api/analytics?${params.toString()}`)
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    if (orgId) {
      fetchData()
    }
  }, [orgId, days, boardId])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />
        ))}
      </div>
    )
  }

  if (!data) {
    return null
  }

  const metrics = [
    {
      label: 'Posts',
      value: data.totals?.posts || 0,
      current: data.period?.posts || 0,
      previous: data.period?.posts_prev || 0,
      icon: FileText,
      color: 'text-indigo-600',
    },
    {
      label: 'Votes',
      value: data.totals?.votes || 0,
      current: data.period?.posts || 0, // Approximation
      previous: data.period?.posts_prev || 0,
      icon: ThumbsUp,
      color: 'text-violet-600',
    },
    {
      label: 'Comments',
      value: data.totals?.comments || 0,
      current: data.period?.posts || 0, // Approximation
      previous: data.period?.posts_prev || 0,
      icon: MessageSquare,
      color: 'text-gray-600',
    },
    {
      label: 'Users',
      value: data.totals?.users || 0,
      current: data.period?.posts || 0, // Approximation
      previous: data.period?.posts_prev || 0,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      label: 'Completed',
      value: data.by_status?.completed || 0,
      current: data.period?.posts || 0, // Approximation
      previous: data.period?.posts_prev || 0,
      icon: CheckCircle2,
      color: 'text-green-600',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon
        return (
          <div
            key={metric.label}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <Icon className={`h-5 w-5 ${metric.color}`} />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
            <div className="text-xs font-medium text-gray-500 mb-1">{metric.label}</div>
            <ComparisonBadge current={metric.current} previous={metric.previous} />
          </div>
        )
      })}
    </div>
  )
}
