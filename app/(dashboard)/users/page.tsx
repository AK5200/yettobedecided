'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Users as UsersIcon } from 'lucide-react'
import { UserDetailDrawer } from '@/components/dashboard/user-detail-drawer'

type UserSource = 'guest' | 'social_google' | 'social_github' | 'identified' | 'verified_jwt'

interface WidgetUser {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  user_source: UserSource
  company_name: string | null
  company_plan: string | null
  company_monthly_spend: number | null
  first_seen_at: string
  last_seen_at: string
  post_count: number
  vote_count: number
  comment_count: number
  is_banned: boolean
  banned_reason: string | null
}

export default function UsersPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<WidgetUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<UserSource | 'all'>('all')
  const [companyFilter, setCompanyFilter] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<WidgetUser | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data: memberships, error: membershipError } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)

    if (membershipError) {
      setLoading(false)
      return
    }

    const orgIds = (memberships || []).map((member: { org_id: string }) => member.org_id)
    if (orgIds.length === 0) {
      setLoading(false)
      return
    }

    const { data: widgetUsers } = await supabase
      .from('widget_users')
      .select('*')
      .in('org_id', orgIds)
      .order('last_seen_at', { ascending: false })

    setUsers(widgetUsers || [])
    setLoading(false)
  }

  const companyOptions = useMemo(() => {
    const companies = users
      .map((user) => user.company_name)
      .filter(Boolean) as string[]
    return Array.from(new Set(companies))
  }, [users])

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSource = sourceFilter === 'all' || user.user_source === sourceFilter
    const matchesCompany = companyFilter === 'all' || user.company_name === companyFilter
    return matchesSearch && matchesSource && matchesCompany
  })

  const getSourceBadge = (source: UserSource) => {
    switch (source) {
      case 'social_google':
        return <Badge className="bg-blue-100 text-blue-700">Google</Badge>
      case 'social_github':
        return <Badge className="bg-gray-200 text-gray-700">GitHub</Badge>
      case 'identified':
        return <Badge className="bg-amber-100 text-amber-700">Identified</Badge>
      case 'verified_jwt':
        return <Badge className="bg-green-100 text-green-700">Verified</Badge>
      default:
        return <Badge variant="secondary">Guest</Badge>
    }
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Users</h1>
        <p className="text-gray-500">
          View and manage users who have interacted with your feedback hub.
        </p>
      </div>

      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="max-w-sm"
        />

        <Select value={sourceFilter} onValueChange={(value) => setSourceFilter(value as UserSource | 'all')}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="guest">Guest</SelectItem>
            <SelectItem value="identified">Identified</SelectItem>
            <SelectItem value="verified_jwt">Verified JWT</SelectItem>
            <SelectItem value="social_google">Google</SelectItem>
            <SelectItem value="social_github">GitHub</SelectItem>
          </SelectContent>
        </Select>

        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All Companies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            {companyOptions.map((company) => (
              <SelectItem key={company} value={company}>
                {company}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b text-sm font-medium text-gray-500">
              <div className="col-span-4">User</div>
              <div className="col-span-2">Source</div>
              <div className="col-span-2">Company</div>
              <div className="col-span-3">Activity</div>
              <div className="col-span-1">Status</div>
            </div>
            <div className="divide-y">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className="grid grid-cols-12 gap-4 px-4 py-3 text-left hover:bg-gray-50 transition-colors items-center"
                >
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name || user.email}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                        {(user.name || user.email || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {user.name || user.email || 'Anonymous'}
                      </div>
                      <div className="text-sm text-gray-500 truncate">{user.email}</div>
                    </div>
                  </div>
                  <div className="col-span-2">{getSourceBadge(user.user_source)}</div>
                  <div className="col-span-2 text-sm text-gray-600">
                    {user.company_name || '—'}
                  </div>
                  <div className="col-span-3 text-sm text-gray-600">
                    {user.post_count} posts · {user.vote_count} votes · {user.comment_count} comments
                  </div>
                  <div className="col-span-1">
                    {user.is_banned ? (
                      <Badge variant="destructive">Banned</Badge>
                    ) : (
                      <Badge variant="secondary">Active</Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      <UserDetailDrawer
        user={selectedUser}
        onOpenChange={(open) => !open && setSelectedUser(null)}
        onUserUpdated={(updated) => {
          setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
          setSelectedUser(updated)
        }}
      />
    </div>
  )
}
