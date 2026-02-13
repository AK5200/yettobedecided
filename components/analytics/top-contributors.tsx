'use client'

import { useState, useEffect } from 'react'
import { Users, Award, Trophy } from 'lucide-react'

interface TopContributorsProps {
  orgId: string
}

interface Contributor {
  id: string
  email: string
  name?: string
  avatar_url?: string
  post_count: number
  vote_count: number
  comment_count: number
  company_name?: string
}

export function TopContributors({ orgId }: TopContributorsProps) {
  const [users, setUsers] = useState<Contributor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `/api/widget-users?org_id=${orgId}&sort=post_count&limit=10`
        )
        if (res.ok) {
          const json = await res.json()
          setUsers(json.users || [])
        }
      } catch (error) {
        console.error('Failed to fetch contributors:', error)
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

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-4 w-4 text-yellow-500" />
    if (index === 1) return <Award className="h-4 w-4 text-gray-400" />
    if (index === 2) return <Award className="h-4 w-4 text-amber-600" />
    return null
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-xl">
          <Users className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Top Contributors</h3>
          <p className="text-sm text-gray-500">Most active users</p>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium">No contributors yet</p>
          <p className="text-xs text-gray-400 mt-1">Users will appear here as they engage</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 max-h-[400px] overflow-y-auto subtle-scrollbar">
        <div className="space-y-3">
          {users.map((user, index) => {
            const displayName = user.name || user.email || 'Anonymous'
            const initials = displayName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)

            return (
              <div
                key={user.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-200 hover:shadow-md transition-all"
              >
                <div className="relative">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={displayName}
                      className="w-12 h-12 rounded-full border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-sm font-bold text-white shadow-md">
                      {initials}
                    </div>
                  )}
                  {index < 3 && (
                    <div className="absolute -top-1 -right-1">
                      {getRankIcon(index)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{displayName}</div>
                  <div className="flex items-center gap-4 mt-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span className="font-semibold text-gray-900">{user.post_count}</span>
                      <span>posts</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span className="font-semibold text-gray-900">{user.vote_count}</span>
                      <span>votes</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        </div>
      )}
    </div>
  )
}
