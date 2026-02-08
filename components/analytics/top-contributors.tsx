'use client'

import { useState, useEffect } from 'react'
import { Users } from 'lucide-react'

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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-900">Top Contributors</h3>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">No contributors yet</div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => {
            const displayName = user.name || user.email || 'Anonymous'
            const initials = displayName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)

            return (
              <div key={user.id} className="flex items-center gap-3">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={displayName}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700">
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {displayName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user.post_count} {user.post_count === 1 ? 'post' : 'posts'}, {user.vote_count}{' '}
                    {user.vote_count === 1 ? 'vote' : 'votes'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
