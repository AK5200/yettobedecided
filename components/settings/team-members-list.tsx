'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface TeamMembersListProps {
  members: any[]
  invitations: any[]
  orgId: string
}

export function TeamMembersList({ members, invitations, orgId }: TeamMembersListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

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
    }

    setLoadingId(null)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Team Members</h2>
        {members.length === 0 ? (
          <p className="text-sm text-gray-600">No members found.</p>
        ) : (
          <div className="space-y-3">
            {members.map((member) => {
              const role = member.role as 'owner' | 'admin' | 'member'
              const email = member.email || member.user_email || member.user_id
              return (
                <div key={member.user_id} className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium">{email}</div>
                    <Badge variant="secondary" className="mt-1">
                      {role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {role !== 'owner' && (
                      <Select
                        value={role}
                        onValueChange={(value) => handleRoleChange(member.user_id, value as 'admin' | 'member')}
                        disabled={loadingId === member.user_id}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    {role !== 'owner' && (
                      <Button
                        variant="outline"
                        onClick={() => handleRemove(member.user_id)}
                        disabled={loadingId === member.user_id}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Pending Invitations</h2>
        {invitations.length === 0 ? (
          <p className="text-sm text-gray-600">No pending invitations.</p>
        ) : (
          <div className="space-y-3">
            {invitations.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{invite.email}</div>
                  <Badge variant="secondary" className="mt-1">
                    {invite.role || 'member'}
                  </Badge>
                </div>
                <Badge variant="outline">Pending</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
