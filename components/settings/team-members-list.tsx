'use client'

interface TeamMembersListProps {
  members: any[]
  invitations: any[]
  orgId: string
}

export function TeamMembersList({ members }: TeamMembersListProps) {
  return (
    <div className="rounded-lg border p-6">
      <div className="text-sm text-gray-600">Members</div>
      <div className="mt-2 text-sm">{members.length} members</div>
    </div>
  )
}
