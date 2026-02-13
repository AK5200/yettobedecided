'use client'

import { useState, useEffect } from 'react'
import { Trophy, Target, HelpCircle, XCircle, Ban, Grid3x3, ChevronLeft, ChevronRight } from 'lucide-react'

interface PriorityMatrixProps {
  orgId: string
  boardId?: string
}

const QUADRANTS = [
  {
    id: 'quick_wins',
    title: 'Quick Wins',
    subtitle: 'High impact, low effort',
    bgGradient: 'from-emerald-50 to-emerald-100',
    borderColor: 'border-emerald-300',
    icon: Trophy,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-100',
    textColor: 'text-emerald-900',
    btnBg: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border-emerald-300',
  },
  {
    id: 'big_bets',
    title: 'Big Bets',
    subtitle: 'High impact, needs investment',
    bgGradient: 'from-blue-50 to-blue-100',
    borderColor: 'border-blue-300',
    icon: Target,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    textColor: 'text-blue-900',
    btnBg: 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300',
  },
  {
    id: 'fill_ins',
    title: 'Fill-ins',
    subtitle: 'Low effort, moderate value',
    bgGradient: 'from-gray-50 to-gray-100',
    borderColor: 'border-gray-300',
    icon: HelpCircle,
    iconColor: 'text-gray-600',
    iconBg: 'bg-gray-100',
    textColor: 'text-gray-900',
    btnBg: 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300',
  },
  {
    id: 'time_sinks',
    title: 'Time Sinks',
    subtitle: 'Disproportionate cost',
    bgGradient: 'from-red-50 to-red-100',
    borderColor: 'border-red-300',
    icon: XCircle,
    iconColor: 'text-red-600',
    iconBg: 'bg-red-100',
    textColor: 'text-red-900',
    btnBg: 'bg-red-100 hover:bg-red-200 text-red-700 border-red-300',
  },
]

const DROP_CATEGORY = {
  id: 'drop',
  title: 'Drop',
  btnBg: 'bg-rose-100 hover:bg-rose-200 text-rose-700 border-rose-300',
}

const ALL_CATEGORIES = [
  ...QUADRANTS.map((q) => ({ id: q.id, title: q.title, btnBg: q.btnBg })),
  DROP_CATEGORY,
]

export function PriorityMatrix({ orgId, boardId }: PriorityMatrixProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [unscoredQueue, setUnscoredQueue] = useState<any[]>([])
  const [unscoredIndex, setUnscoredIndex] = useState(0)
  const [assigning, setAssigning] = useState(false)

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

  // Update unscored queue when data changes
  useEffect(() => {
    if (data?.unscored) {
      setUnscoredQueue([...data.unscored])
      setUnscoredIndex((prev) => Math.min(prev, Math.max(0, data.unscored.length - 1)))
    }
  }, [data?.unscored])

  const handleAssignCategory = async (postId: string, category: string) => {
    setAssigning(true)
    try {
      const res = await fetch('/api/analytics/prioritization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, priority_category: category }),
      })
      if (res.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Failed to assign category:', error)
    } finally {
      setAssigning(false)
    }
  }

  const handleReassignCategory = async (postId: string, category: string | null) => {
    try {
      const res = await fetch('/api/analytics/prioritization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, priority_category: category }),
      })
      if (res.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Failed to reassign category:', error)
    }
  }

  const handleSkip = () => {
    if (unscoredQueue.length <= 1) return
    setUnscoredQueue((prev) => {
      const current = prev[unscoredIndex]
      const newQueue = [...prev]
      newQueue.splice(unscoredIndex, 1)
      newQueue.push(current)
      return newQueue
    })
    setUnscoredIndex((prev) => Math.min(prev, unscoredQueue.length - 2))
  }

  const handlePrevious = () => {
    if (unscoredIndex > 0) {
      setUnscoredIndex((prev) => prev - 1)
    }
  }

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

  const currentUnscoredPost = unscoredQueue[unscoredIndex]
  const dropPosts = data.drop || []

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-xl">
            <Grid3x3 className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Prioritization Matrix</h3>
            <p className="text-sm text-gray-500">
              Categorize posts by selecting a priority bucket.
            </p>
          </div>
        </div>
        {unscoredQueue.length > 0 && (
          <span className="px-3 py-1.5 bg-amber-100 text-amber-700 text-sm font-semibold rounded-lg">
            {unscoredQueue.length} unscored
          </span>
        )}
      </div>

      {/* Main 2x2 grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
              <div className="max-h-[200px] overflow-y-auto subtle-scrollbar">
                <div className="space-y-2">
                  {posts.map((post: any) => (
                    <div
                      key={post.id}
                      className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-white/50 shadow-sm hover:shadow-md transition-shadow group"
                    >
                      <div className="font-semibold text-gray-900 text-sm truncate">
                        {post.title}
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="text-xs text-gray-500">
                          {post.vote_count || 0} votes
                        </div>
                        <button
                          onClick={() => handleReassignCategory(post.id, null)}
                          className="text-xs text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Move back to unscored"
                        >
                          Remove
                        </button>
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
            </div>
          )
        })}
      </div>

      {/* Drop section */}
      {dropPosts.length > 0 && (
        <div className="bg-gradient-to-br from-rose-50 to-rose-100 border-2 border-rose-300 rounded-2xl p-5 shadow-md mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-rose-100 rounded-xl">
              <Ban className="h-5 w-5 text-rose-600" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-rose-900 text-lg">Drop</div>
              <div className="text-xs text-rose-900 opacity-75">Won&apos;t pursue</div>
            </div>
            <div className="px-3 py-1.5 bg-rose-100 rounded-lg">
              <span className="text-lg font-bold text-rose-900">{dropPosts.length}</span>
            </div>
          </div>
          <div className="max-h-[200px] overflow-y-auto subtle-scrollbar">
            <div className="space-y-2">
              {dropPosts.map((post: any) => (
                <div
                  key={post.id}
                  className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-white/50 shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="font-semibold text-gray-900 text-sm truncate">
                    {post.title}
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="text-xs text-gray-500">
                      {post.vote_count || 0} votes
                    </div>
                    <button
                      onClick={() => handleReassignCategory(post.id, null)}
                      className="text-xs text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Move back to unscored"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Unscored Posts — Card Wizard */}
      {unscoredQueue.length > 0 && currentUnscoredPost && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-semibold">
                {unscoredQueue.length}
              </span>
              Unscored Posts
            </h4>
            <span className="text-sm text-gray-500">
              {unscoredIndex + 1} of {unscoredQueue.length}
            </span>
          </div>

          <div className="bg-white rounded-2xl border-2 border-amber-200 shadow-md p-6">
            <h5 className="text-lg font-bold text-gray-900 mb-2">
              {currentUnscoredPost.title}
            </h5>
            {currentUnscoredPost.content && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                {currentUnscoredPost.content}
              </p>
            )}
            <div className="text-xs text-gray-500 mb-5">
              {currentUnscoredPost.vote_count || 0} votes
            </div>

            {/* Category selection buttons */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Assign to category
              </div>
              <div className="flex flex-wrap gap-2">
                {ALL_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleAssignCategory(currentUnscoredPost.id, cat.id)}
                    disabled={assigning}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg border cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed ${cat.btnBg}`}
                  >
                    {cat.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={handlePrevious}
                disabled={unscoredIndex === 0}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-sm font-medium text-amber-600 hover:text-amber-800 bg-amber-50 rounded-lg hover:bg-amber-100 cursor-pointer flex items-center gap-1 transition-colors"
              >
                Skip
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
