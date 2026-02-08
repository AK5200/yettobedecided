'use client'

import { useState, useEffect } from 'react'
import { Flame } from 'lucide-react'

interface TrendingPostsProps {
  orgId: string
  boardId?: string
}

export function TrendingPosts({ orgId, boardId }: TrendingPostsProps) {
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week')
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams({
          org_id: orgId,
          period,
          limit: '10',
        })
        if (boardId) {
          params.append('board_id', boardId)
        }
        const res = await fetch(`/api/analytics/trending?${params.toString()}`)
        if (res.ok) {
          const json = await res.json()
          setPosts(json.posts || [])
        }
      } catch (error) {
        console.error('Failed to fetch trending posts:', error)
      } finally {
        setLoading(false)
      }
    }

    if (orgId) {
      fetchData()
    }
  }, [orgId, period, boardId])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="h-5 w-5 text-orange-500" />
        <h3 className="text-lg font-semibold text-gray-900">Trending</h3>
      </div>

      {/* Period tabs */}
      <div className="flex gap-1 mb-4">
        {[
          { label: '7D', value: 'week' as const },
          { label: '30D', value: 'month' as const },
          { label: 'All', value: 'all' as const },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setPeriod(tab.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              period === tab.value
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Posts list */}
      {posts.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">No trending posts</div>
      ) : (
        <div className="space-y-2">
          {posts.map((post, index) => (
            <div
              key={post.id}
              className="flex items-start gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold">
                #{index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{post.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">{post.vote_count || 0} votes</span>
                  {post.velocity > 0 && (
                    <span className="text-xs text-green-600 font-medium">
                      +{post.velocity}/day
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
