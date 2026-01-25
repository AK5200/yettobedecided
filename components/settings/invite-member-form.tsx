'use client'

interface InviteMemberFormProps {
  orgId: string
}

export function InviteMemberForm({ orgId }: InviteMemberFormProps) {
  return (
    <div className="rounded-lg border p-6">
      <div className="text-sm text-gray-600">Invite members to org {orgId}</div>
    </div>
  )
}
