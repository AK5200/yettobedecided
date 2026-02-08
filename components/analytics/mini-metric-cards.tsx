'use client'

import { useState, useEffect } from 'react'
import { FileText, ThumbsUp, MessageSquare, Users, CheckCircle2 } from 'lucide-react'
import { ComparisonBadge } from './comparison-badge'
import Link from 'next/link'

interface MiniMetricCardsProps {
  orgId: string
}

export function MiniMetricCards({ orgId }: MiniMetricCardsProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/analytics?org_id=${orgId}&days=7`)
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
  }, [orgId])

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
      current: data.period?.posts || 0,
      previous: data.period?.posts_prev || 0,
      icon: ThumbsUp,
      color: 'text-violet-600',
    },
    {
      label: 'Comments',
      value: data.totals?.comments || 0,
      current: data.period?.posts || 0,
      previous: data.period?.posts_prev || 0,
      icon: MessageSquare,
      color: 'text-gray-600',
    },
    {
      label: 'Users',
      value: data.totals?.users || 0,
      current: data.period?.posts || 0,
      previous: data.period?.posts_prev || 0,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      label: 'Completed',
      value: data.by_status?.completed || 0,
      current: data.period?.posts || 0,
      previous: data.period?.posts_prev || 0,
      icon: CheckCircle2,
      color: 'text-green-600',
    },
  ]

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">This Week</h2>
        <Link
          href="/analytics"
          className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          View Analytics →
        </Link>
      </div>
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
    </section>
  )
}
