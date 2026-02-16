'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, Clock, Crown, Shield, User, Trash2, UserX } from 'lucide-react'

interface TeamMembersListProps {
  members: any[]
  invitations: any[]
  orgId: string
}

export function TeamMembersList({ members, invitations, orgId }: TeamMembersListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const router = useRouter()

  const handleRoleChange = async (userId: string, role: 'admin' | 'member') => {
    setLoadingId(userId)
    const response = await fetch(`/api/team/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: orgId, role }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      toast.error(errorData.error || 'Failed to update role.')
    } else {
      toast.success('Role updated!')
      router.refresh()
    }

    setLoadingId(null)
  }

  const handleRemove = async (userId: string) => {
    const confirmed = window.confirm('Remove this member from the organization?')
    if (!confirmed) return

    setLoadingId(userId)
    const response = await fetch(`/api/team/${userId}?org_id=${orgId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json()
      toast.error(errorData.error || 'Failed to remove member.')
    } else {
      toast.success('Member removed.')
      router.refresh()
    }

    setLoadingId(null)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3.5 w-3.5" />
      case 'admin':
        return <Shield className="h-3.5 w-3.5" />
      default:
        return <User className="h-3.5 w-3.5" />
    }
  }

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'admin':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-amber-500', 'bg-blue-500', 'bg-emerald-500', 'bg-violet-500',
      'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500',
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  return (
    <div className="space-y-6">
      {/* Active Members */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-200">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-2.5 bg-blue-100 rounded-xl">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-gray-900">Team Members</h3>
              <span className="inline-flex items-center justify-center h-6 min-w-[1.5rem] px-2 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                {members.length}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              People with access to your organization.
            </p>
          </div>
        </div>

        {members.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <UserX className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-500">No members found</p>
            <p className="text-xs text-gray-400 mt-1">Invite someone to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((member) => {
              const role = member.role as 'owner' | 'admin' | 'member'
              const email = member.email || member.user_email || member.user_id
              const name = member.name || null
              const displayName = name || email
              return (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full ${getAvatarColor(displayName)} flex items-center justify-center text-white font-semibold text-sm shrink-0 shadow-sm`}>
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {name && (
                          <span className="text-sm font-semibold text-gray-900 truncate">{name}</span>
                        )}
                        <Badge className={`gap-1 text-xs ${getRoleBadgeClass(role)}`}>
                          {getRoleIcon(role)}
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500 truncate">{email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {role !== 'owner' && (
                      <>
                        <Select
                          value={role}
                          onValueChange={(value) => handleRoleChange(member.user_id, value as 'admin' | 'member')}
                          disabled={loadingId === member.user_id}
                        >
                          <SelectTrigger className="w-28 h-9 text-xs rounded-lg">
                            <SelectValue placeholder="Role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(member.user_id)}
                          disabled={loadingId === member.user_id}
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg h-9 w-9 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-200">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-2.5 bg-orange-100 rounded-xl">
            <Clock className="h-5 w-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-gray-900">Pending Invitations</h3>
              {invitations.length > 0 && (
                <span className="inline-flex items-center justify-center h-6 min-w-[1.5rem] px-2 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">
                  {invitations.length}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Invitations waiting to be accepted.
            </p>
          </div>
        </div>

        {invitations.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Clock className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-500">No pending invitations</p>
            <p className="text-xs text-gray-400 mt-1">All invitations have been accepted.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {invitations.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-sm shrink-0">
                    {invite.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{invite.email}</div>
                    <Badge className={`text-xs mt-0.5 ${getRoleBadgeClass(invite.role || 'member')}`}>
                      {getRoleIcon(invite.role || 'member')}
                      {(invite.role || 'member').charAt(0).toUpperCase() + (invite.role || 'member').slice(1)}
                    </Badge>
                  </div>
                </div>
                <Badge className="text-xs bg-orange-50 text-orange-600 border border-orange-200 shrink-0">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
