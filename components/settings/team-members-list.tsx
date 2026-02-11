'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, Clock, Crown, Shield, User, Trash2 } from 'lucide-react'

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
        return 'bg-amber-100 text-amber-700'
      case 'admin':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Team Members</h3>
            <p className="text-sm text-gray-500">
              {members.length} {members.length === 1 ? 'member' : 'members'} in your organization.
            </p>
          </div>
        </div>

        {members.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No members found.</p>
        ) : (
          <div className="space-y-3">
            {members.map((member) => {
              const role = member.role as 'owner' | 'admin' | 'member'
              const email = member.email || member.user_email || member.user_id
              const name = member.name || null
              return (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-sm">
                      {(name || email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      {name && <div className="text-sm font-medium text-gray-900">{name}</div>}
                      <div className={`text-sm ${name ? 'text-gray-500' : 'font-medium text-gray-900'}`}>{email}</div>
                      <Badge className={`mt-1 gap-1 ${getRoleBadgeClass(role)}`}>
                        {getRoleIcon(role)}
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {role !== 'owner' && (
                      <>
                        <Select
                          value={role}
                          onValueChange={(value) => handleRoleChange(member.user_id, value as 'admin' | 'member')}
                          disabled={loadingId === member.user_id}
                        >
                          <SelectTrigger className="w-28 h-8 text-xs">
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
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
      </Card>

      <Card className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Pending Invitations</h3>
            <p className="text-sm text-gray-500">
              {invitations.length} pending {invitations.length === 1 ? 'invitation' : 'invitations'}.
            </p>
          </div>
        </div>

        {invitations.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No pending invitations.</p>
        ) : (
          <div className="space-y-3">
            {invitations.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-medium text-sm">
                    {invite.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{invite.email}</div>
                    <Badge className={getRoleBadgeClass(invite.role || 'member')}>
                      {invite.role || 'member'}
                    </Badge>
                  </div>
                </div>
                <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                  Pending
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
