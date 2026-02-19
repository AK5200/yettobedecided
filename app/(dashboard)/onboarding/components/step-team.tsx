'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, ArrowLeft, Loader2, Send, Rocket, Check, Mail, Shield } from 'lucide-react'
import { toast } from 'sonner'

interface StepTeamProps {
  orgId: string
  onComplete: () => void
  onBack: () => void
}

export function StepTeam({ orgId, onComplete, onBack }: StepTeamProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'member'>('admin')
  const [loading, setLoading] = useState(false)
  const [invitedEmails, setInvitedEmails] = useState<string[]>([])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId, email: email.trim(), role }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to send invitation')
        setLoading(false)
        return
      }

      toast.success(`Invitation sent to ${email}`)
      setInvitedEmails((prev) => [...prev, email.trim()])
      setEmail('')
    } catch {
      toast.error('Failed to send invitation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-100 to-pink-50 flex items-center justify-center mx-auto mb-4">
          <Users className="h-6 w-6 text-pink-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Invite your team</h2>
        <p className="text-sm text-gray-400 mt-1.5">
          Collaborate with your team to manage feedback together.
        </p>
        <p className="text-xs text-gray-300 mt-1">Optional — you can invite people later.</p>
      </div>

      {/* Invite Form */}
      <form onSubmit={handleInvite} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr,130px] gap-2.5">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email" className="text-sm font-medium text-gray-600 flex items-center gap-1.5">
              <Mail className="h-3 w-3 text-gray-400" />
              Email address
            </Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 text-sm"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-role" className="text-sm font-medium text-gray-600 flex items-center gap-1.5">
              <Shield className="h-3 w-3 text-gray-400" />
              Role
            </Label>
            <Select value={role} onValueChange={(v) => setRole(v as 'admin' | 'member')}>
              <SelectTrigger id="invite-role" className="h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          type="submit"
          variant="outline"
          disabled={loading || !email.trim()}
          className="w-full h-9 text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5 mr-2" />
              Send Invite
            </>
          )}
        </Button>
      </form>

      {/* Invited list */}
      {invitedEmails.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Invited</p>
          {invitedEmails.map((e) => (
            <div key={e} className="flex items-center gap-2 px-3 py-2 bg-emerald-50/50 border border-emerald-100 rounded-lg text-xs">
              <Check className="h-3 w-3 text-emerald-500 shrink-0" />
              <span className="text-gray-600">{e}</span>
            </div>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-11 px-5 rounded-xl text-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onComplete}
          className="flex-1 h-11 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl shadow-sm hover:shadow-md transition-all"
        >
          <Rocket className="h-4 w-4 mr-2" />
          Finish Setup
        </Button>
      </div>
    </div>
  )
}
