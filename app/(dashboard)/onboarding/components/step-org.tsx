'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, ArrowRight, Loader2, Check, Plus } from 'lucide-react'

interface StepOrgProps {
  onComplete: (orgId: string, orgSlug: string) => void
}

interface ExistingOrg {
  id: string
  name: string
  slug: string
}

export function StepOrg({ onComplete }: StepOrgProps) {
  const [existingOrg, setExistingOrg] = useState<ExistingOrg | null>(null)
  const [showCreateNew, setShowCreateNew] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const checkExistingOrg = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setChecking(false); return }

        const { data: membership } = await supabase
          .from('org_members')
          .select('org_id')
          .eq('user_id', user.id)
          .single()

        if (membership?.org_id) {
          const { data: org } = await supabase
            .from('organizations')
            .select('id, name, slug')
            .eq('id', membership.org_id)
            .single()

          if (org) {
            setExistingOrg(org)
          }
        }
      } catch {
        // No org found, show create form
      } finally {
        setChecking(false)
      }
    }
    checkExistingOrg()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create organization')
        setLoading(false)
        return
      }

      onComplete(data.id, data.slug)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="py-12 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center mx-auto mb-4">
          <Building2 className="h-6 w-6 text-amber-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">
          {existingOrg ? 'Your organization' : 'Create your organization'}
        </h2>
        <p className="text-sm text-gray-400 mt-1.5">
          {existingOrg
            ? 'Continue with your existing organization or create a new one.'
            : 'This is where you\u2019ll collect and manage all your feedback.'
          }
        </p>
      </div>

      {/* Existing org card */}
      {existingOrg && !showCreateNew && (
        <div className="space-y-4">
          <div
            className="flex items-center gap-4 p-4 bg-amber-50/50 border border-amber-200/60 rounded-xl cursor-pointer hover:border-amber-300 transition-all"
            onClick={() => onComplete(existingOrg.id, existingOrg.slug)}
          >
            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
              {existingOrg.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm">{existingOrg.name}</p>
              <p className="text-xs text-gray-400 truncate">/{existingOrg.slug}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-amber-600">Continue</span>
              <ArrowRight className="h-4 w-4 text-amber-500" />
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-300">or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateNew(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Create a new organization
          </button>
        </div>
      )}

      {/* Create form */}
      {(!existingOrg || showCreateNew) && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name" className="text-sm font-medium text-gray-600">
              Organization name
            </Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Inc"
              className="h-11"
              required
              autoFocus
            />
            <p className="text-xs text-gray-300">
              You can change this later in settings.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3">
            {showCreateNew && existingOrg && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateNew(false)}
                className="h-11 px-5 rounded-xl text-sm"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 h-11 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
