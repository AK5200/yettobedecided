'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Fingerprint, ArrowRight, ArrowLeft, Loader2, LogIn, UserCheck, Globe, ChevronDown, ExternalLink, Shield, Key, Mail } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface StepIdentityProps {
  onComplete: () => void
  onBack: () => void
}

const METHODS = [
  {
    id: 'kelo' as const,
    icon: LogIn,
    iconColor: 'text-amber-600',
    iconBg: 'from-amber-100 to-amber-50',
    label: 'Kelo Login',
    badge: 'Recommended',
    badgeCls: 'bg-amber-50 text-amber-600 border-amber-200',
    short: 'We handle authentication. Zero work on your end.',
    details: [
      { icon: Shield, text: 'Users sign in via Google or GitHub OAuth' },
      { icon: UserCheck, text: 'User identity is verified and stored automatically' },
      { icon: Mail, text: 'Email and name are captured from the OAuth provider' },
    ],
    note: 'Best for most teams. Users get a familiar login experience with no code required.',
    docSection: '#widget-auth',
    docLabel: 'Widget Authentication docs',
  },
  {
    id: 'none' as const,
    icon: UserCheck,
    iconColor: 'text-emerald-600',
    iconBg: 'from-emerald-100 to-emerald-50',
    label: 'Guest Posting',
    badge: null,
    badgeCls: '',
    short: 'No login. Users provide their name and email.',
    details: [
      { icon: Mail, text: 'Users enter their email and name when posting feedback' },
      { icon: UserCheck, text: 'No verification — anyone can submit feedback' },
      { icon: Shield, text: 'You can ban emails from the moderation panel if needed' },
    ],
    note: 'Best for quick feedback collection where login friction is a concern.',
    docSection: '#guest-mode',
    docLabel: 'Guest Mode docs',
  },
  {
    id: 'customer' as const,
    icon: Globe,
    iconColor: 'text-blue-600',
    iconBg: 'from-blue-100 to-blue-50',
    label: 'Your Website (SSO)',
    badge: 'Advanced',
    badgeCls: 'bg-blue-50 text-blue-600 border-blue-200',
    short: 'Identify users from your own auth system.',
    details: [
      { icon: Key, text: 'Your backend generates a signed JWT token with the user\'s identity' },
      { icon: Shield, text: 'Pass the token to the Kelo widget on page load' },
      { icon: UserCheck, text: 'We verify the token and auto-identify the user — no separate login' },
    ],
    note: 'Best for SaaS products. Users stay logged in via your app — they never see a login screen on Kelo.',
    docSection: '#jwt-mode',
    docLabel: 'JWT / SSO setup guide',
  },
]

export function StepIdentity({ onComplete, onBack }: StepIdentityProps) {
  const [loginHandler, setLoginHandler] = useState<'kelo' | 'customer' | 'none'>('kelo')
  const [expandedMethod, setExpandedMethod] = useState<string | null>('kelo')
  const [ssoRedirectUrl, setSsoRedirectUrl] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSelect = (id: 'kelo' | 'customer' | 'none') => {
    setLoginHandler(id)
    setExpandedMethod(expandedMethod === id ? null : id)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const handler = loginHandler === 'none' ? null : loginHandler

      const payload: Record<string, unknown> = {
        login_handler: handler,
        sso_redirect_enabled: loginHandler === 'customer',
        sso_redirect_url: loginHandler === 'customer' ? ssoRedirectUrl : '',
      }

      if (loginHandler === 'none') {
        payload.guest_posting_enabled = true
      }

      const res = await fetch('/api/sso/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Failed to save')

      toast.success('Settings saved')
      onComplete()
    } catch {
      toast.error('Failed to save settings')
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center mx-auto mb-4">
          <Fingerprint className="h-6 w-6 text-indigo-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">User identification</h2>
        <p className="text-sm text-gray-400 mt-1.5">
          How should users be identified when giving feedback?
        </p>
      </div>

      {/* Method Cards */}
      <div className="space-y-2.5">
        {METHODS.map((method) => {
          const selected = loginHandler === method.id
          const expanded = expandedMethod === method.id
          const Icon = method.icon

          return (
            <div key={method.id} className="rounded-xl overflow-hidden transition-all duration-200">
              {/* Selectable header */}
              <button
                type="button"
                onClick={() => handleSelect(method.id)}
                className={`
                  w-full flex items-center gap-3.5 p-4 text-left transition-all border
                  ${selected
                    ? 'bg-white border-amber-200 shadow-sm'
                    : 'bg-gray-50/50 border-gray-100 hover:border-gray-200 hover:bg-white'
                  }
                  ${expanded && selected ? 'rounded-t-xl rounded-b-none border-b-0' : 'rounded-xl'}
                `}
              >
                {/* Radio */}
                <div className={`
                  w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors
                  ${selected ? 'border-amber-500' : 'border-gray-300'}
                `}>
                  {selected && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                </div>

                {/* Icon */}
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${method.iconBg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-4 w-4 ${method.iconColor}`} />
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{method.label}</span>
                    {method.badge && (
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${method.badgeCls}`}>
                        {method.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{method.short}</p>
                </div>

                {/* Expand indicator */}
                <ChevronDown className={`h-4 w-4 text-gray-300 shrink-0 transition-transform duration-200 ${expanded && selected ? 'rotate-180' : ''}`} />
              </button>

              {/* Expandable detail */}
              {expanded && selected && (
                <div className="border border-t-0 border-amber-200 bg-white rounded-b-xl px-4 pb-4">
                  <div className="border-t border-gray-100 pt-4 space-y-3">
                    {/* How it works */}
                    <div className="space-y-2">
                      {method.details.map((detail, i) => {
                        const DetailIcon = detail.icon
                        return (
                          <div key={i} className="flex items-start gap-2.5">
                            <div className="w-5 h-5 rounded-md bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
                              <DetailIcon className="h-3 w-3 text-gray-400" />
                            </div>
                            <p className="text-[13px] text-gray-600 leading-snug">{detail.text}</p>
                          </div>
                        )
                      })}
                    </div>

                    {/* Note */}
                    <p className="text-xs text-gray-400 italic pl-[30px]">{method.note}</p>

                    {/* SSO URL field */}
                    {method.id === 'customer' && (
                      <div className="space-y-2 mt-3 pt-3 border-t border-gray-100">
                        <Label htmlFor="sso-url" className="text-sm font-medium text-gray-600">
                          Your login page URL
                        </Label>
                        <Input
                          id="sso-url"
                          placeholder="https://yourapp.com/login"
                          value={ssoRedirectUrl}
                          onChange={(e) => setSsoRedirectUrl(e.target.value)}
                          className="h-10 text-sm"
                        />
                      </div>
                    )}

                    {/* Doc link */}
                    <div className="flex justify-end pt-1">
                      <Link
                        href={`/widgets/docs${method.docSection}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors"
                      >
                        {method.docLabel}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

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
          onClick={handleSave}
          disabled={saving}
          className="flex-1 h-11 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl shadow-sm hover:shadow-md transition-all"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
      <div className="text-center">
        <button
          type="button"
          onClick={onComplete}
          className="text-xs text-gray-300 hover:text-gray-500 transition-colors"
        >
          Skip this step
        </button>
      </div>
    </div>
  )
}
