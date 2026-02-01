'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Eye, EyeOff, Copy, RefreshCw, Link } from 'lucide-react'
import { toast } from 'sonner'
import { CodeExamples } from './code-examples'

export default function SSOSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [guestPostingEnabled, setGuestPostingEnabled] = useState(true)
  const [socialLoginEnabled, setSocialLoginEnabled] = useState(true)
  const [ssoRedirectEnabled, setSsoRedirectEnabled] = useState(false)
  const [ssoRedirectUrl, setSsoRedirectUrl] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [savingRedirect, setSavingRedirect] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/sso/settings')
      const data = await res.json()
      setGuestPostingEnabled(!!data.guest_posting_enabled)
      setSocialLoginEnabled(!!data.social_login_enabled)
      setSsoRedirectEnabled(!!data.sso_redirect_enabled)
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

  const handleSaveRedirect = async () => {
    setSavingRedirect(true)
    await updateSettings({
      sso_redirect_enabled: ssoRedirectEnabled,
      sso_redirect_url: ssoRedirectUrl,
    })
    setSavingRedirect(false)
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">User Identification</h1>
        <p className="text-gray-500">
          Configure how users authenticate when interacting with your feedback widget.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Guest Posting</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-600">
              Allow users to submit feedback with only their email and name.
            </p>
          </div>
          <Switch
            checked={guestPostingEnabled}
            onCheckedChange={(value) => {
              setGuestPostingEnabled(value)
              updateSettings({ guest_posting_enabled: value })
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social Login</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-600">
              Enable Google and GitHub login options for widget users.
            </p>
          </div>
          <Switch
            checked={socialLoginEnabled}
            onCheckedChange={(value) => {
              setSocialLoginEnabled(value)
              updateSettings({ social_login_enabled: value })
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SSO Redirect (Enterprise)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm text-gray-600">
              Redirect users to your SSO provider for authentication.
            </Label>
            <Switch
              checked={ssoRedirectEnabled}
              onCheckedChange={setSsoRedirectEnabled}
            />
          </div>
          <Input
            placeholder="https://sso.yourcompany.com/login"
            value={ssoRedirectUrl}
            onChange={(event) => setSsoRedirectUrl(event.target.value)}
            disabled={!ssoRedirectEnabled}
          />
          <div className="flex justify-end">
            <Button onClick={handleSaveRedirect} disabled={savingRedirect}>
              {savingRedirect ? 'Saving...' : 'Save Redirect Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SDK Integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {secretKey ? (
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={showKey ? secretKey : '•'.repeat(40)}
                className="font-mono text-sm"
              />
              <Button variant="outline" size="icon" onClick={() => setShowKey(!showKey)}>
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={() => copyToClipboard(secretKey)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button onClick={() => generateKey(false)}>
              Generate Secret Key
            </Button>
          )}
          <Button variant="outline" onClick={() => generateKey(true)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate Key
          </Button>
          <Button
            variant="ghost"
            className="justify-start"
            onClick={() => document.getElementById('integration-guide')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <Link className="h-4 w-4 mr-2" />
            View integration guide
          </Button>
        </CardContent>
      </Card>

      <Card id="integration-guide">
        <CardHeader>
          <CardTitle>Integration Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <CodeExamples secretKey={secretKey} />
        </CardContent>
      </Card>
    </div>
  )
}
