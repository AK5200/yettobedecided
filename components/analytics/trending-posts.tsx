'use client'

import { useState, useEffect } from 'react'
import { Flame, TrendingUp } from 'lucide-react'

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
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-xl">
            <Flame className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Trending Posts</h3>
            <p className="text-sm text-gray-500">Most popular feedback</p>
          </div>
        </div>
      </div>

      {/* Period tabs */}
      <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { label: '7D', value: 'week' as const },
          { label: '30D', value: 'month' as const },
          { label: 'All', value: 'all' as const },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setPeriod(tab.value)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all cursor-pointer ${
              period === tab.value
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Posts list */}
      {posts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium">No trending posts</p>
          <p className="text-xs text-gray-400 mt-1">Posts will appear here as they gain traction</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 max-h-[400px] overflow-y-auto subtle-scrollbar">
          <div className="space-y-3">
            {posts.map((post, index) => (
              <div
                key={post.id}
                className="flex items-start gap-4 p-4 rounded-xl bg-white border border-gray-200 hover:shadow-md transition-all group cursor-default"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center text-sm font-bold shadow-md">
                  #{index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate mb-2 group-hover:text-orange-600 transition-colors">
                    {post.title}
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-violet-500" />
                      <span className="text-sm font-medium text-gray-700">
                        {post.vote_count || 0} votes
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-sm font-medium text-gray-700">
                        {post.comment_count || 0} comments
                      </span>
                    </div>
                    {post.velocity > 0 && (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-md">
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-xs font-semibold text-emerald-700">
                          +{post.velocity}/day
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
