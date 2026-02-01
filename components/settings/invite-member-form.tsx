'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserPlus, Mail, Shield } from 'lucide-react'

interface InviteMemberFormProps {
  orgId: string
}

export function InviteMemberForm({ orgId }: InviteMemberFormProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'member'>('member')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const response = await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: orgId, email, role }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      toast.error(errorData.error || 'Failed to send invitation.')
    } else {
      toast.success('Invitation sent!')
      setEmail('')
      setRole('member')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
          <UserPlus className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">Invite Team Member</h3>
          <p className="text-sm text-gray-500">Send an invitation to add someone to your team.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email" className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              Email Address
            </Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-role" className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-400" />
              Role
            </Label>
            <Select value={role} onValueChange={(value) => setRole(value as 'admin' | 'member')}>
              <SelectTrigger id="invite-role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            {loading ? 'Sending...' : 'Send Invite'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
