'use client'

import { useState, useEffect } from 'react'
import { EffortSelector } from './effort-selector'
import { Trophy, Target, HelpCircle, XCircle } from 'lucide-react'

interface PriorityMatrixProps {
  orgId: string
  boardId?: string
}

const QUADRANTS = [
  {
    id: 'quick_wins',
    title: 'Quick Wins',
    subtitle: 'High value, low effort',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    icon: Trophy,
    iconColor: 'text-emerald-600',
  },
  {
    id: 'big_bets',
    title: 'Big Bets',
    subtitle: 'High value, high effort',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: Target,
    iconColor: 'text-blue-600',
  },
  {
    id: 'fill_ins',
    title: 'Fill-ins',
    subtitle: 'Low value, low effort',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: HelpCircle,
    iconColor: 'text-gray-600',
  },
  {
    id: 'time_sinks',
    title: 'Time Sinks',
    subtitle: 'Low value, high effort',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: XCircle,
    iconColor: 'text-red-600',
  },
]

export function PriorityMatrix({ orgId, boardId }: PriorityMatrixProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const params = new URLSearchParams({ org_id: orgId })
      if (boardId) {
        params.append('board_id', boardId)
      }
      const res = await fetch(`/api/analytics/prioritization?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (error) {
      console.error('Failed to fetch prioritization data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (orgId) {
      fetchData()
    }
  }, [orgId, boardId])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Prioritization Matrix</h3>
        {data.unscored && data.unscored.length > 0 && (
          <span className="text-sm text-gray-500">
            {data.unscored.length} unscored {data.unscored.length === 1 ? 'post' : 'posts'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {QUADRANTS.map((quadrant) => {
          const Icon = quadrant.icon
          const posts = data[quadrant.id] || []
          return (
            <div
              key={quadrant.id}
              className={`${quadrant.bgColor} ${quadrant.borderColor} border-2 rounded-xl p-4`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-5 w-5 ${quadrant.iconColor}`} />
                <div>
                  <div className="font-semibold text-gray-900">{quadrant.title}</div>
                  <div className="text-xs text-gray-600">{quadrant.subtitle}</div>
                </div>
                <div className="ml-auto text-sm font-semibold text-gray-700">
                  {posts.length}
                </div>
              </div>
              <div className="space-y-2 mt-3">
                {posts.slice(0, 3).map((post: any) => (
                  <div
                    key={post.id}
                    className="bg-white rounded-md p-2 text-sm border border-gray-200"
                  >
                    <div className="font-medium text-gray-900 truncate">{post.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {post.vote_count || 0} votes
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {data.unscored && data.unscored.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Unscored Posts</h4>
          <div className="space-y-3">
            {data.unscored.map((post: any) => (
              <div
                key={post.id}
                className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{post.title}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {post.vote_count || 0} votes
                  </div>
                </div>
                <EffortSelector
                  postId={post.id}
                  currentEffort={post.effort}
                  onUpdate={() => fetchData()}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
