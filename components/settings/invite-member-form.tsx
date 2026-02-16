'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserPlus, Mail, Shield, Loader2, Send } from 'lucide-react'

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
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-200">
      <div className="flex items-start gap-4 mb-6">
        <div className="p-2.5 bg-amber-100 rounded-xl">
          <UserPlus className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Invite Team Member</h3>
          <p className="text-sm text-gray-500">Send an invitation to add someone to your team.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email" className="flex items-center gap-2 text-sm font-medium text-gray-700">
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
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-role" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Shield className="h-4 w-4 text-gray-400" />
              Role
            </Label>
            <Select value={role} onValueChange={(value) => setRole(value as 'admin' | 'member')}>
              <SelectTrigger id="invite-role" className="h-11">
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
            className="bg-amber-500 hover:bg-amber-600 text-white h-11 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Invite
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
