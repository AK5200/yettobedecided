'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Eye, EyeOff, Copy, RefreshCw, Fingerprint, UserCheck,
  LogIn, Key, BookOpen, CheckCircle2, Loader2, Shield
} from 'lucide-react'
import { toast } from 'sonner'
import { CodeExamples } from './code-examples'

export default function SSOSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [guestPostingEnabled, setGuestPostingEnabled] = useState(true)
  const [loginHandler, setLoginHandler] = useState<'kelo' | 'customer' | null>(null)
  const [ssoRedirectUrl, setSsoRedirectUrl] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [savingRedirect, setSavingRedirect] = useState(false)
  const [savingHandler, setSavingHandler] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/sso/settings')
      const data = await res.json()
      setGuestPostingEnabled(!!data.guest_posting_enabled)
      setLoginHandler(data.login_handler || (data.social_login_enabled ? 'kelo' : null))
      setSsoRedirectUrl(data.sso_redirect_url || '')
      setSecretKey(data.secret_key || '')
    } catch (error) {
      console.error('Failed to fetch SSO settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (payload: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/sso/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Settings saved')
    } catch (error) {
      console.error('Failed to update SSO settings:', error)
      toast.error('Failed to save settings')
    }
  }

  const generateKey = async (isRegenerate: boolean = false) => {
    if (isRegenerate && !confirm('This will invalidate all existing tokens. Continue?')) return
    try {
      const res = await fetch('/api/sso/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_key' }),
      })
      const data = await res.json()
      if (data.secret_key) {
        setSecretKey(data.secret_key)
        toast.success(isRegenerate ? 'Secret key regenerated' : 'Secret key generated')
      }
    } catch (error) {
      console.error('Failed to generate key:', error)
      toast.error('Failed to generate key')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  if (loading) {
    return (
      <div className="flex-1 bg-gradient-to-br from-gray-50 to-white min-h-screen">
        <div className="p-4 md:p-8 max-w-3xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-violet-100 rounded-xl">
            <Fingerprint className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Identification</h1>
            <p className="text-sm text-gray-500">
              Configure how users authenticate when interacting with your feedback widget.
            </p>
          </div>
        </div>

        {/* Guest Posting */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-emerald-100 rounded-xl">
                <UserCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Guest Posting</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Allow users to submit feedback with only their email and name.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Badge className={`text-xs ${guestPostingEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                {guestPostingEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
              <Switch
                checked={guestPostingEnabled}
                onCheckedChange={(value) => {
                  setGuestPostingEnabled(value)
                  updateSettings({ guest_posting_enabled: value })
                }}
              />
            </div>
          </div>
        </div>

        {/* Login Handler */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-200">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-2.5 bg-blue-100 rounded-xl">
              <LogIn className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Login Handler</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Choose who handles user login when users try to post while logged out.
              </p>
            </div>
          </div>

          <RadioGroup
            value={loginHandler || 'none'}
            onValueChange={(value) => {
              const handler = value === 'none' ? null : value as 'kelo' | 'customer'
              setLoginHandler(handler)
              if (handler === null && !guestPostingEnabled) {
                setGuestPostingEnabled(true)
                updateSettings({ guest_posting_enabled: true })
              }
            }}
            className="space-y-3"
          >
            <label
              htmlFor="kelo"
              className={`flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                loginHandler === 'kelo'
                  ? 'border-amber-300 bg-amber-50/50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <RadioGroupItem value="kelo" id="kelo" className="mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">Kelo</span>
                  <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200">Recommended</Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  We handle login (Google/GitHub OAuth)
                </p>
              </div>
            </label>

            <label
              htmlFor="customer"
              className={`flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                loginHandler === 'customer'
                  ? 'border-amber-300 bg-amber-50/50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <RadioGroupItem value="customer" id="customer" className="mt-0.5" />
              <div className="flex-1">
                <span className="font-medium text-gray-900">Your Website</span>
                <p className="text-sm text-gray-500 mt-1">
                  Redirect to your login page
                </p>
              </div>
            </label>

            <label
              htmlFor="none"
              className={`flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                !loginHandler
                  ? 'border-amber-300 bg-amber-50/50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <RadioGroupItem value="none" id="none" className="mt-0.5" />
              <div className="flex-1">
                <span className="font-medium text-gray-900">None</span>
                <p className="text-sm text-gray-500 mt-1">
                  No login handler (users must use guest posting if enabled)
                </p>
              </div>
            </label>
          </RadioGroup>

          {loginHandler === 'customer' && (
            <div className="mt-5 space-y-3 pt-5 border-t border-gray-200">
              <Label htmlFor="sso_redirect_url" className="text-sm font-medium text-gray-700">
                Login Page URL
              </Label>
              <Input
                id="sso_redirect_url"
                placeholder="https://yourapp.com/login"
                value={ssoRedirectUrl}
                onChange={(event) => setSsoRedirectUrl(event.target.value)}
                className="h-11"
              />
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button
              onClick={async () => {
                setSavingHandler(true)
                await updateSettings({
                  login_handler: loginHandler,
                  sso_redirect_enabled: loginHandler === 'customer',
                  sso_redirect_url: loginHandler === 'customer' ? ssoRedirectUrl : '',
                })
                setSavingHandler(false)
              }}
              className="bg-amber-500 hover:bg-amber-600 text-white h-11 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
            >
              {savingHandler ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Login Handler'
              )}
            </Button>
          </div>
        </div>

        {/* SDK Integration */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-200">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-2.5 bg-indigo-100 rounded-xl">
              <Key className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-gray-900">SDK Integration</h3>
                {secretKey && (
                  <Badge className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Key Active
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Generate a secret key to identify users via the Kelo SDK.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {secretKey ? (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
                  Secret Key
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={showKey ? secretKey : '\u2022'.repeat(40)}
                    className="font-mono text-sm bg-white h-11"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowKey(!showKey)}
                    className="h-11 w-11 shrink-0 rounded-lg"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(secretKey)}
                    className="h-11 w-11 shrink-0 rounded-lg"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-3">
                  <Key className="h-6 w-6 text-indigo-600" />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">No secret key generated</p>
                <p className="text-xs text-gray-500 mb-4">Generate a key to start identifying users via the SDK.</p>
                <Button
                  onClick={() => generateKey(false)}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Generate Secret Key
                </Button>
              </div>
            )}

            {secretKey && (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => generateKey(true)}
                  className="rounded-lg text-sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate Key
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Integration Guide */}
        <div id="integration-guide" className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-200">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-2.5 bg-amber-100 rounded-xl">
              <BookOpen className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Integration Guide</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Follow these examples to integrate user identification into your app.
              </p>
            </div>
          </div>
          <CodeExamples secretKey={secretKey} />
        </div>
      </div>
    </div>
  )
}
