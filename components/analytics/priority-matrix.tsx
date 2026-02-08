'use client'

import { useState, useEffect } from 'react'
import { EffortSelector } from './effort-selector'
import { Trophy, Target, HelpCircle, XCircle, Grid3x3 } from 'lucide-react'

interface PriorityMatrixProps {
  orgId: string
  boardId?: string
}

const QUADRANTS = [
  {
    id: 'quick_wins',
    title: 'Quick Wins',
    subtitle: 'High value, low effort',
    bgGradient: 'from-emerald-50 to-emerald-100',
    borderColor: 'border-emerald-300',
    icon: Trophy,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-100',
    textColor: 'text-emerald-900',
  },
  {
    id: 'big_bets',
    title: 'Big Bets',
    subtitle: 'High value, high effort',
    bgGradient: 'from-blue-50 to-blue-100',
    borderColor: 'border-blue-300',
    icon: Target,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    textColor: 'text-blue-900',
  },
  {
    id: 'fill_ins',
    title: 'Fill-ins',
    subtitle: 'Low value, low effort',
    bgGradient: 'from-gray-50 to-gray-100',
    borderColor: 'border-gray-300',
    icon: HelpCircle,
    iconColor: 'text-gray-600',
    iconBg: 'bg-gray-100',
    textColor: 'text-gray-900',
  },
  {
    id: 'time_sinks',
    title: 'Time Sinks',
    subtitle: 'Low value, high effort',
    bgGradient: 'from-red-50 to-red-100',
    borderColor: 'border-red-300',
    icon: XCircle,
    iconColor: 'text-red-600',
    iconBg: 'bg-red-100',
    textColor: 'text-red-900',
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
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="h-96 bg-gray-100 animate-pulse rounded-xl" />
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-xl">
            <Grid3x3 className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Prioritization Matrix</h3>
            <p className="text-sm text-gray-500">Categorize posts by value and effort</p>
          </div>
        </div>
        {data.unscored && data.unscored.length > 0 && (
          <span className="px-3 py-1.5 bg-amber-100 text-amber-700 text-sm font-semibold rounded-lg">
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
              className={`bg-gradient-to-br ${quadrant.bgGradient} ${quadrant.borderColor} border-2 rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 ${quadrant.iconBg} rounded-xl`}>
                  <Icon className={`h-5 w-5 ${quadrant.iconColor}`} />
                </div>
                <div className="flex-1">
                  <div className={`font-bold ${quadrant.textColor} text-lg`}>
                    {quadrant.title}
                  </div>
                  <div className={`text-xs ${quadrant.textColor} opacity-75`}>
                    {quadrant.subtitle}
                  </div>
                </div>
                <div className={`px-3 py-1.5 ${quadrant.iconBg} rounded-lg`}>
                  <span className={`text-lg font-bold ${quadrant.textColor}`}>
                    {posts.length}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {posts.slice(0, 3).map((post: any) => (
                  <div
                    key={post.id}
                    className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-white/50 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="font-semibold text-gray-900 text-sm truncate mb-1">
                      {post.title}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {post.vote_count || 0} votes
                      </div>
                    </div>
                  </div>
                ))}
                {posts.length === 0 && (
                  <div className="text-center py-4 text-sm text-gray-500">
                    No posts in this category
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {data.unscored && data.unscored.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-semibold">
              {data.unscored.length}
            </span>
            Unscored Posts - Set effort level to categorize
          </h4>
          <div className="space-y-3">
            {data.unscored.map((post: any) => (
              <div
                key={post.id}
                className="flex items-center justify-between bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate mb-1">{post.title}</div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{post.vote_count || 0} votes</span>
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
