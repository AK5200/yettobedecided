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
          <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-2xl" />
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
      gradient: 'from-indigo-500 to-indigo-600',
      bgGradient: 'from-indigo-50 to-indigo-100',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
    },
    {
      label: 'Votes',
      value: data.totals?.votes || 0,
      current: data.period?.posts || 0,
      previous: data.period?.posts_prev || 0,
      icon: ThumbsUp,
      gradient: 'from-violet-500 to-violet-600',
      bgGradient: 'from-violet-50 to-violet-100',
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
    },
    {
      label: 'Comments',
      value: data.totals?.comments || 0,
      current: data.period?.posts || 0,
      previous: data.period?.posts_prev || 0,
      icon: MessageSquare,
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'from-emerald-50 to-emerald-100',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
    {
      label: 'Users',
      value: data.totals?.users || 0,
      current: data.period?.posts || 0,
      previous: data.period?.posts_prev || 0,
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Resolved',
      value: (data.by_status?.shipped || 0) + (data.by_status?.closed || 0),
      current: data.period?.posts || 0,
      previous: data.period?.posts_prev || 0,
      icon: CheckCircle2,
      gradient: 'from-green-500 to-green-600',
      bgGradient: 'from-green-50 to-green-100',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon
        return (
          <div
            key={metric.label}
            className={`bg-gradient-to-br ${metric.bgGradient} rounded-2xl shadow-lg border border-gray-200 p-5 hover:shadow-xl transition-all duration-200 group`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2.5 ${metric.iconBg} rounded-xl group-hover:scale-110 transition-transform`}>
                <Icon className={`h-5 w-5 ${metric.iconColor}`} />
              </div>
            </div>
            <div className="mb-2">
              <div className={`text-3xl font-bold bg-gradient-to-r ${metric.gradient} bg-clip-text text-transparent`}>
                {metric.value.toLocaleString()}
              </div>
              <div className="text-sm font-semibold text-gray-700 mt-1">{metric.label}</div>
            </div>
            <ComparisonBadge current={metric.current} previous={metric.previous} />
          </div>
        )
      })}
    </div>
  )
}
