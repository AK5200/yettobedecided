'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Lock, Globe, Shield, Mail } from 'lucide-react'
import { toast } from 'sonner'

interface CommentFormProps {
  postId: string
  isAdmin?: boolean
  authorEmail?: string
  authorName?: string
  onCommentAdded: () => void
  guestCommentingEnabled?: boolean
  orgSlug?: string
  loginHandler?: string | null
  ssoRedirectUrl?: string | null
  orgName?: string
}

// Google icon SVG
function GoogleIcon() {
  return (
    <svg className="h-3.5 w-3.5 mr-1.5" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export function CommentForm({
  postId,
  isAdmin,
  authorEmail,
  authorName,
  onCommentAdded,
  guestCommentingEnabled = true,
  orgSlug,
  loginHandler,
  ssoRedirectUrl,
  orgName,
}: CommentFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [isInternal, setIsInternal] = useState(false)
  const [localName, setLocalName] = useState('')
  const [verifiedUser, setVerifiedUser] = useState<{ email: string; name?: string } | null>(() => {
    // Read shared identity from localStorage
    if (typeof window === 'undefined' || !orgSlug) return null
    try {
      const stored = localStorage.getItem(`kelo_identified_user_${orgSlug}`)
      if (stored) return JSON.parse(stored)
    } catch {}
    return null
  })

  // Check widget_session cookie for shared auth (if no local identity and no admin email)
  useEffect(() => {
    if (verifiedUser || authorEmail || !orgSlug) return
    fetch('/api/auth/widget/session')
      .then(r => r.json())
      .then(data => {
        if (data.user?.email) {
          setVerifiedUser({ email: data.user.email, name: data.user.name })
          try {
            localStorage.setItem(`kelo_identified_user_${orgSlug}`, JSON.stringify(data.user))
          } catch {}
        }
      })
      .catch(() => {})
  }, [orgSlug, authorEmail])

  // Verify flow state
  const [showVerify, setShowVerify] = useState(false)
  const [verifyStep, setVerifyStep] = useState<'options' | 'email' | 'code'>('options')
  const [verifyEmail, setVerifyEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [verificationToken, setVerificationToken] = useState('')

  const effectiveEmail = verifiedUser?.email || authorEmail || ''
  const effectiveName = verifiedUser?.name || authorName || localName
  const isIdentified = !!(verifiedUser || authorEmail)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!content.trim()) return
    if (!effectiveName.trim() && !effectiveEmail.trim()) {
      toast.error('Please enter your name to comment.')
      return
    }
    setLoading(true)
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        post_id: postId,
        content,
        author_email: effectiveEmail || null,
        author_name: effectiveName || null,
        guest_email: effectiveEmail || null,
        guest_name: effectiveName || null,
        is_from_admin: isAdmin || false,
        is_internal: isInternal,
      }),
    })

    if (!response.ok) {
      const data = await response.json()
      toast.error(data.error || 'Failed to post comment')
      setLoading(false)
      return
    }

    setContent('')
    onCommentAdded()
    setLoading(false)
  }

  const handleVerifyEmailSend = async () => {
    if (!verifyEmail) return
    setOtpLoading(true)
    setOtpError('')
    try {
      const res = await fetch('/api/auth/widget/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifyEmail, org_slug: orgSlug }),
      })
      if (res.ok) {
        const data = await res.json()
        setVerificationToken(data.token || '')
        setVerifyStep('code')
      } else {
        const data = await res.json().catch(() => ({}))
        setOtpError(data.error || 'Failed to send code')
      }
    } catch {
      setOtpError('Failed to send code')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (otpCode.length !== 6) return
    setOtpLoading(true)
    setOtpError('')
    try {
      const res = await fetch('/api/auth/widget/magic-link', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationToken, code: otpCode }),
      })
      if (res.ok) {
        const userData = { email: verifyEmail, name: localName || verifyEmail.split('@')[0] }
        setVerifiedUser(userData)
        try { localStorage.setItem(`kelo_identified_user_${orgSlug}`, JSON.stringify(userData)) } catch {}
        setShowVerify(false)
        setVerifyStep('options')
        toast.success('Identity verified!')
      } else {
        const data = await res.json().catch(() => ({}))
        setOtpError(data.error || 'Invalid code')
      }
    } catch {
      setOtpError('Verification failed')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleGoogleVerify = () => {
    const popup = window.open(
      `/api/auth/widget/google?org_slug=${orgSlug}&popup=1`,
      'kelo-oauth', 'width=500,height=600,left=200,top=100'
    )
    const handleOAuth = (event: MessageEvent) => {
      if (event.data && event.data.type === 'kelo:identity') {
        const user = event.data.user
        if (user) {
          const userData = { email: user.email, name: user.name }
          setVerifiedUser(userData)
          try { localStorage.setItem(`kelo_identified_user_${orgSlug}`, JSON.stringify(userData)) } catch {}
          setShowVerify(false)
          toast.success('Identity verified!')
        }
        window.removeEventListener('message', handleOAuth)
      }
    }
    window.addEventListener('message', handleOAuth)
  }

  const canSubmit = content.trim() && (effectiveName.trim() || effectiveEmail.trim())

  // Verify panel — reusable for both guest-on and guest-off states
  const verifyPanel = (
    <div className="p-3 rounded-xl border border-border/40 bg-muted/20 space-y-2.5">
      {verifyStep === 'code' ? (
        <>
          <p className="text-xs text-muted-foreground text-center">
            Code sent to <strong className="text-foreground">{verifyEmail}</strong>
          </p>
          <Input
            placeholder="000000"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="h-10 text-center text-lg tracking-[0.25em] font-mono rounded-lg"
            maxLength={6}
            autoFocus
          />
          {otpError && <p className="text-xs text-red-500 text-center">{otpError}</p>}
          <Button
            type="button"
            onClick={handleVerifyCode}
            disabled={otpCode.length !== 6 || otpLoading}
            className="w-full h-9 text-sm rounded-lg font-semibold cursor-pointer"
          >
            {otpLoading ? 'Verifying...' : 'Verify Code'}
          </Button>
        </>
      ) : verifyStep === 'email' ? (
        <>
          <Input
            placeholder="Your email"
            type="email"
            value={verifyEmail}
            onChange={(e) => setVerifyEmail(e.target.value)}
            className="h-10 text-sm rounded-lg"
            autoFocus
          />
          {otpError && <p className="text-xs text-red-500 text-center">{otpError}</p>}
          <Button
            type="button"
            onClick={handleVerifyEmailSend}
            disabled={!verifyEmail || otpLoading}
            variant="outline"
            className="w-full h-9 text-sm rounded-lg font-medium cursor-pointer"
          >
            <Mail className="h-4 w-4 mr-2" />
            {otpLoading ? 'Sending...' : 'Send Code'}
          </Button>
        </>
      ) : loginHandler === 'customer' && ssoRedirectUrl ? (
        <Button
          type="button"
          onClick={() => {
            const returnUrl = typeof window !== 'undefined' ? window.location.href : ''
            window.location.href = `${ssoRedirectUrl}?redirect=${encodeURIComponent(returnUrl)}&kelo=open`
          }}
          className="w-full h-9 text-sm rounded-lg font-semibold cursor-pointer"
        >
          Login to {orgName || 'continue'}
        </Button>
      ) : (
        <div className="space-y-2">
          <Button
            type="button"
            onClick={() => setVerifyStep('email')}
            variant="outline"
            className="w-full h-9 text-sm rounded-lg font-medium cursor-pointer"
          >
            <Mail className="h-4 w-4 mr-2" />
            Verify with email
          </Button>
          {orgSlug && (
            <Button
              type="button"
              onClick={handleGoogleVerify}
              variant="outline"
              className="w-full h-9 text-sm rounded-lg font-medium cursor-pointer"
            >
              <GoogleIcon />
              Continue with Google
            </Button>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => { setShowVerify(false); setVerifyStep('options'); setOtpError('') }}
        className="text-xs text-muted-foreground/50 hover:text-muted-foreground w-full text-center cursor-pointer transition-colors"
      >
        Cancel
      </button>
    </div>
  )

  // Guest commenting OFF and not verified — show login prompt
  if (!guestCommentingEnabled && !isIdentified && !isAdmin) {
    // Customer login handler — show direct redirect button
    if (loginHandler === 'customer' && ssoRedirectUrl) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground text-center">Login to comment</p>
          <Button
            type="button"
            onClick={() => {
              const returnUrl = typeof window !== 'undefined' ? window.location.href : ''
              window.location.href = `${ssoRedirectUrl}?redirect=${encodeURIComponent(returnUrl)}&kelo=open`
            }}
            className="w-full h-10 text-sm rounded-lg font-semibold cursor-pointer"
          >
            Login to {orgName || 'continue'}
          </Button>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground text-center">Verify your identity to comment</p>
        {showVerify ? verifyPanel : (
          <Button
            type="button"
            onClick={() => setShowVerify(true)}
            variant="outline"
            className="w-full h-10 text-sm rounded-lg font-medium cursor-pointer"
          >
            <Shield className="h-4 w-4 mr-2" />
            Login to comment
          </Button>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {!isIdentified && !isAdmin && (
        <div className="space-y-1.5">
          <Label htmlFor={`comment-name-${postId}`}>Name</Label>
          <Input
            id={`comment-name-${postId}`}
            placeholder="Your name"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
          />
          {/* Optional verify link */}
          {showVerify ? verifyPanel : (
            <button
              type="button"
              onClick={() => setShowVerify(true)}
              className="flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer"
            >
              <Shield className="h-3 w-3" />
              Verify your identity
            </button>
          )}
        </div>
      )}
      {isIdentified && !isAdmin && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Shield className="h-3.5 w-3.5 text-emerald-500" />
          <span>Commenting as <strong className="text-foreground">{effectiveName || effectiveEmail}</strong></span>
        </div>
      )}
      <Textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Write a comment..."
        className={isInternal ? 'border-yellow-400 bg-yellow-50' : ''}
      />
      <div className="flex items-center justify-between">
        <Button type="submit" disabled={loading || !canSubmit}>
          {loading ? 'Posting...' : 'Post Comment'}
        </Button>
        {isAdmin && (
          <div className='flex items-center gap-2'>
            <Switch checked={isInternal} onCheckedChange={setIsInternal} />
            <span className='text-sm flex items-center gap-1'>
              {isInternal ? (
                <><Lock className='w-4 h-4 text-yellow-600' /> Internal</>
              ) : (
                <><Globe className='w-4 h-4 text-muted-foreground' /> Public</>
              )}
            </span>
          </div>
        )}
      </div>
    </form>
  )
}
