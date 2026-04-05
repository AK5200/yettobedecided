'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Check, Clock, Mail, LogIn } from 'lucide-react'

interface FeedbackBoard {
  id: string
  name: string
}

interface FeedbackWidgetProps {
  boards: FeedbackBoard[]
  orgSlug: string
  onSubmit?: (post?: any) => void
  accentColor?: string
  showBranding?: boolean
}

export function FeedbackWidget({
  boards,
  orgSlug,
  onSubmit,
  accentColor = '#000000',
  showBranding = true,
}: FeedbackWidgetProps) {
  const [selectedBoard, setSelectedBoard] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<boolean | 'pending'>(false)
  const [submitError, setSubmitError] = useState('')
  const [identifiedUser, setIdentifiedUser] = useState<any>(null)
  const [isIdentified, setIsIdentified] = useState(false)
  const [guestPostingEnabled, setGuestPostingEnabled] = useState(true)
  const [loginHandler, setLoginHandler] = useState<'kelo' | 'customer' | null>(null)
  const [ssoRedirectUrl, setSsoRedirectUrl] = useState('')
  const [orgName, setOrgName] = useState('')
  const [configLoading, setConfigLoading] = useState(true)
  const [guestEmail, setGuestEmail] = useState('')
  const [guestName, setGuestName] = useState('')
  const [magicLinkStep, setMagicLinkStep] = useState<'email' | 'code' | null>(null)
  const [magicLinkEmail, setMagicLinkEmail] = useState('')
  const [verificationToken, setVerificationToken] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [oauthError, setOauthError] = useState('')

  useEffect(() => {
    if (!selectedBoard && boards.length > 0) {
      setSelectedBoard(boards[0].id)
    }
  }, [boards, selectedBoard])

  // Fetch org config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`/api/widget/config?org=${encodeURIComponent(orgSlug)}`)
        if (res.ok) {
          const data = await res.json()
          setGuestPostingEnabled(data.auth?.guestPostingEnabled ?? true)
          setLoginHandler(data.auth?.loginHandler || null)
          setSsoRedirectUrl(data.auth?.ssoRedirectUrl || '')
          setOrgName(data.org?.name || '')
        }
      } catch (error) {
        console.error('Failed to load widget config:', error)
      } finally {
        setConfigLoading(false)
      }
    }
    fetchConfig()
  }, [orgSlug])

  useEffect(() => {
    // Listen for identity from parent via postMessage
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'kelo:identity') {
        const user = event.data.user
        if (user) {
          setIsIdentified(true)
          setIdentifiedUser(user)
          // Store in sessionStorage for persistence (scoped per org)
          try {
            sessionStorage.setItem(`kelo_identified_user_${orgSlug}`, JSON.stringify(user))
          } catch (e) {
            // Ignore storage errors
          }
        }
      }
    }

    window.addEventListener('message', handleMessage)

    // Check sessionStorage for existing identity (scoped per org)
    try {
      const stored = sessionStorage.getItem(`kelo_identified_user_${orgSlug}`)
      if (stored) {
        const user = JSON.parse(stored)
        setIsIdentified(true)
        setIdentifiedUser(user)
      }
    } catch (e) {
      // Ignore storage errors
    }

    // Request identity from parent (if same origin)
    try {
      if (window.parent && window.parent !== window) {
        try {
          const parentHub = (window.parent as any)?.Kelo
          if (parentHub && parentHub.isIdentified && parentHub.isIdentified()) {
            setIsIdentified(true)
            setIdentifiedUser(parentHub.getUser ? parentHub.getUser() : null)
          }
        } catch (e) {
          // Cross-origin - will rely on postMessage instead
        }
      }
    } catch (error) {
      // Ignore errors
    }

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [orgSlug])

  const handleGuestSubmit = (email: string, name: string) => {
    if (!email) return
    setGuestEmail(email)
    setGuestName(name)
    setIsIdentified(true)
    // Store in sessionStorage so vote flow can read the email
    const userData = { id: email, email, name }
    setIdentifiedUser(userData)
    try {
      sessionStorage.setItem(`kelo_identified_user_${orgSlug}`, JSON.stringify(userData))
    } catch {
      // Ignore storage errors
    }
    // Also try to identify in parent if possible
    try {
      if (window.parent && window.parent !== window) {
        try {
          const parentHub = (window.parent as any)?.Kelo
          if (parentHub?.identify) {
            parentHub.identify(userData)
          }
        } catch (e) {
          // Cross-origin error - ignore
        }
      }
    } catch (error) {
      // Silently handle any errors
    }
  }

  const handleSocialClick = (provider: 'google') => {
    setOauthError('')
    const url = `/api/auth/widget/${provider}?org_slug=${encodeURIComponent(orgSlug)}&popup=1`
    const popup = window.open(url, 'kelo_oauth', 'width=500,height=600,scrollbars=yes')

    if (!popup || popup.closed) {
      setOauthError('Popup was blocked by your browser. Please allow popups for this site and try again.')
      return
    }

    // Set a timeout for waiting for the OAuth postMessage response
    const OAUTH_TIMEOUT_MS = 120_000 // 2 minutes
    const timeoutId = setTimeout(() => {
      window.removeEventListener('message', oauthMessageHandler)
      if (!popup.closed) {
        popup.close()
      }
      setOauthError('Login timed out. Please try again.')
    }, OAUTH_TIMEOUT_MS)

    const oauthMessageHandler = (event: MessageEvent) => {
      if (event.data && event.data.type === 'kelo:oauth-success') {
        clearTimeout(timeoutId)
        window.removeEventListener('message', oauthMessageHandler)
        const user = event.data.user
        if (user) {
          setIdentifiedUser(user)
          setIsIdentified(true)
          try {
            sessionStorage.setItem(`kelo_identified_user_${orgSlug}`, JSON.stringify(user))
          } catch {
            // Ignore storage errors
          }
        }
      }
    }

    window.addEventListener('message', oauthMessageHandler)

    // Also clean up if user closes the popup manually
    const pollTimer = setInterval(() => {
      if (popup.closed) {
        clearInterval(pollTimer)
        clearTimeout(timeoutId)
        window.removeEventListener('message', oauthMessageHandler)
      }
    }, 500)
  }

  const handleCustomerLogin = () => {
    if (!ssoRedirectUrl) return

    // Get parent page URL, not iframe URL
    let parentUrl = ''
    try {
      // Try to get parent URL (same-origin only)
      parentUrl = window.top?.location.href || window.location.href
    } catch (e) {
      // Cross-origin - use document.referrer as fallback
      parentUrl = document.referrer || window.location.origin
    }

    const redirectUrl = `${ssoRedirectUrl}?redirect=${encodeURIComponent(parentUrl)}&kelo=open`

    if (window.top) {
      window.top.location.href = redirectUrl
    } else {
      window.location.href = redirectUrl
    }
  }

  const handleMagicLinkSend = async () => {
    if (!magicLinkEmail) return
    setOtpLoading(true)
    setOtpError('')

    try {
      const res = await fetch('/api/auth/widget/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: magicLinkEmail, org_slug: orgSlug }),
      })
      const data = await res.json()

      if (!res.ok) {
        setOtpError(data.error || 'Failed to send code')
        return
      }

      setVerificationToken(data.verificationToken)
      setMagicLinkStep('code')
    } catch {
      setOtpError('Network error. Please try again.')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleMagicLinkVerify = async () => {
    if (!otpCode || otpCode.length !== 6) return
    setOtpLoading(true)
    setOtpError('')

    try {
      const res = await fetch('/api/auth/widget/magic-link/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationToken, code: otpCode }),
      })
      const data = await res.json()

      if (data.exhausted) {
        setOtpError('Too many attempts. Please request a new code.')
        setMagicLinkStep('email')
        setOtpCode('')
        return
      }

      if (!res.ok) {
        if (data.verificationToken) {
          setVerificationToken(data.verificationToken)
        }
        setOtpError(data.attemptsRemaining != null
          ? `Invalid code. ${data.attemptsRemaining} attempt${data.attemptsRemaining === 1 ? '' : 's'} remaining.`
          : (data.error || 'Invalid code'))
        setOtpCode('')
        return
      }

      const user = data.user
      setIdentifiedUser(user)
      setIsIdentified(true)
      setMagicLinkStep(null)

      try {
        sessionStorage.setItem(`kelo_identified_user_${orgSlug}`, JSON.stringify(user))
      } catch {
        // Ignore storage errors
      }
    } catch {
      setOtpError('Network error. Please try again.')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedBoard || !title.trim()) return
    setLoading(true)
    setSuccess(false)

    // Use stored identified user (from postMessage or sessionStorage)
    let identifiedPayload = identifiedUser || null
    if (!identifiedPayload) {
      // Fallback: try to get from parent (same origin only)
      try {
        if (window.parent && window.parent !== window) {
          try {
            const parentHub = (window.parent as any)?.Kelo
            identifiedPayload = parentHub?._getIdentifyPayload ? parentHub._getIdentifyPayload() : null
          } catch (e) {
            // Cross-origin error - ignore
          }
        }
      } catch (error) {
        // Ignore errors
      }
    }

    setSubmitError('')
    try {
      const response = await fetch('/api/widget/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_slug: orgSlug,
          board_id: selectedBoard,
          title,
          content,
          guest_email: identifiedUser?.email || guestEmail,
          guest_name: identifiedUser?.name || guestName,
          identified_user: identifiedPayload,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setTitle('')
        setContent('')
        setSuccess(data.post?.is_approved === false ? 'pending' : true)
        onSubmit?.(data.post)
      } else {
        const data = await response.json().catch(() => ({}))
        setSubmitError(data.error || 'Failed to submit feedback. Please try again.')
      }
    } catch {
      setSubmitError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (configLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
      </div>
    )
  }

  // Divider component
  const OrDivider = ({ text = 'or' }: { text?: string }) => (
    <div className="relative flex items-center py-1">
      <div className="flex-1 border-t border-border/60 dark:border-white/10" />
      <span className="px-3 text-xs text-muted-foreground/60 font-medium bg-background dark:bg-[#1a1a1a]">{text}</span>
      <div className="flex-1 border-t border-border/60 dark:border-white/10" />
    </div>
  )

  // Google icon SVG
  const GoogleIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )

  // Render logic based on auth state and config
  const showForm = isIdentified || identifiedUser

  return (
    <div className="space-y-5">
      {!showForm && (
        <div className="space-y-4">
          {guestPostingEnabled ? (
            // Guest posting enabled - show email/name form, optionally show login options
            <>
              <div className="space-y-3">
                <Input
                  placeholder="Email"
                  value={guestEmail}
                  onChange={(event) => setGuestEmail(event.target.value)}
                  className="h-11 rounded-xl border-border/60 dark:border-white/10 focus:ring-2 focus:ring-offset-0 transition-all duration-200 placeholder:text-muted-foreground/50"
                  style={{ '--tw-ring-color': `${accentColor}30` } as React.CSSProperties}
                />
                <Input
                  placeholder="Name (optional)"
                  value={guestName}
                  onChange={(event) => setGuestName(event.target.value)}
                  className="h-11 rounded-xl border-border/60 dark:border-white/10 focus:ring-2 focus:ring-offset-0 transition-all duration-200 placeholder:text-muted-foreground/50"
                  style={{ '--tw-ring-color': `${accentColor}30` } as React.CSSProperties}
                />
                <Button
                  className="w-full h-11 rounded-xl font-semibold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  onClick={() => handleGuestSubmit(guestEmail, guestName)}
                  disabled={!guestEmail}
                  style={{
                    backgroundColor: accentColor,
                    boxShadow: `0 4px 14px -3px ${accentColor}40`
                  }}
                >
                  Continue
                </Button>
              </div>

              {/* Show login options below if login handler is configured */}
              {loginHandler === 'kelo' && (
                <>
                  <OrDivider text="or verify your email" />
                  {magicLinkStep === 'code' ? (
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className="w-10 h-10 rounded-xl bg-muted/50 dark:bg-white/5 flex items-center justify-center mx-auto mb-2.5">
                          <Mail className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Enter the 6-digit code sent to <strong className="text-foreground">{magicLinkEmail}</strong>
                        </p>
                      </div>
                      <Input
                        placeholder="000000"
                        value={otpCode}
                        onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="text-center text-2xl tracking-[0.3em] font-mono h-12 rounded-xl border-border/60 dark:border-white/10 focus:ring-2 focus:ring-offset-0 transition-all duration-200"
                        style={{ '--tw-ring-color': `${accentColor}30` } as React.CSSProperties}
                        maxLength={6}
                        autoFocus
                      />
                      {otpError && (
                        <p className="text-xs text-red-500 text-center font-medium">{otpError}</p>
                      )}
                      <Button
                        className="w-full h-11 rounded-xl font-semibold text-white cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                        onClick={handleMagicLinkVerify}
                        disabled={otpCode.length !== 6 || otpLoading}
                        style={{ backgroundColor: accentColor, boxShadow: `0 4px 14px -3px ${accentColor}40` }}
                      >
                        {otpLoading ? 'Verifying...' : 'Verify Code'}
                      </Button>
                      <button
                        className="text-xs text-muted-foreground/50 hover:text-muted-foreground w-full text-center cursor-pointer transition-colors duration-200"
                        onClick={() => { setMagicLinkStep('email'); setOtpCode(''); setOtpError('') }}
                      >
                        Use a different email
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Input
                        placeholder="Enter your email"
                        type="email"
                        value={magicLinkEmail}
                        onChange={(event) => setMagicLinkEmail(event.target.value)}
                        className="h-11 rounded-xl border-border/60 dark:border-white/10 focus:ring-2 focus:ring-offset-0 transition-all duration-200 placeholder:text-muted-foreground/50"
                        style={{ '--tw-ring-color': `${accentColor}30` } as React.CSSProperties}
                      />
                      {otpError && (
                        <p className="text-xs text-red-500 text-center font-medium">{otpError}</p>
                      )}
                      <Button
                        variant="outline"
                        className="w-full h-11 rounded-xl font-semibold cursor-pointer border-border/60 dark:border-white/10 hover:bg-muted/50 dark:hover:bg-white/5 transition-all duration-200"
                        onClick={handleMagicLinkSend}
                        disabled={!magicLinkEmail || otpLoading}
                      >
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        {otpLoading ? 'Sending...' : 'Send Verification Code'}
                      </Button>
                    </div>
                  )}
                  <OrDivider />
                  {oauthError && (
                    <p className="text-xs text-red-500 text-center font-medium">{oauthError}</p>
                  )}
                  <div className="flex gap-2.5">
                    <Button
                      variant="outline"
                      className="w-full h-11 rounded-xl font-medium border-border/60 dark:border-white/10 hover:bg-muted/50 dark:hover:bg-white/5 hover:shadow-sm transition-all duration-200 cursor-pointer"
                      onClick={() => handleSocialClick('google')}
                    >
                      <GoogleIcon />
                      <span className="ml-2">Google</span>
                    </Button>
                  </div>
                </>
              )}
              {loginHandler === 'customer' && (
                <>
                  <OrDivider />
                  <Button
                    variant="outline"
                    className="w-full h-11 rounded-xl font-medium border-border/60 dark:border-white/10 hover:bg-muted/50 dark:hover:bg-white/5 hover:shadow-sm transition-all duration-200 cursor-pointer"
                    onClick={handleCustomerLogin}
                  >
                    <LogIn className="h-4 w-4 mr-2 text-muted-foreground" />
                    Login with {orgName || 'your account'}
                  </Button>
                </>
              )}
            </>
          ) : (
            // Guest posting disabled - must login
            <>
              {loginHandler === 'kelo' ? (
                <div className="space-y-4">
                  <div className="text-center py-2">
                    <div className="w-12 h-12 rounded-2xl bg-muted/50 dark:bg-white/5 flex items-center justify-center mx-auto mb-3">
                      <LogIn className="h-6 w-6 text-muted-foreground/60" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">
                      Please login to submit feedback
                    </p>
                  </div>
                  {magicLinkStep === 'code' ? (
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className="w-10 h-10 rounded-xl bg-muted/50 dark:bg-white/5 flex items-center justify-center mx-auto mb-2.5">
                          <Mail className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Enter the 6-digit code sent to <strong className="text-foreground">{magicLinkEmail}</strong>
                        </p>
                      </div>
                      <Input
                        placeholder="000000"
                        value={otpCode}
                        onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="text-center text-2xl tracking-[0.3em] font-mono h-12 rounded-xl border-border/60 dark:border-white/10 focus:ring-2 focus:ring-offset-0 transition-all duration-200"
                        style={{ '--tw-ring-color': `${accentColor}30` } as React.CSSProperties}
                        maxLength={6}
                        autoFocus
                      />
                      {otpError && (
                        <p className="text-xs text-red-500 text-center font-medium">{otpError}</p>
                      )}
                      <Button
                        className="w-full h-11 rounded-xl font-semibold text-white cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                        onClick={handleMagicLinkVerify}
                        disabled={otpCode.length !== 6 || otpLoading}
                        style={{ backgroundColor: accentColor, boxShadow: `0 4px 14px -3px ${accentColor}40` }}
                      >
                        {otpLoading ? 'Verifying...' : 'Verify Code'}
                      </Button>
                      <button
                        className="text-xs text-muted-foreground/50 hover:text-muted-foreground w-full text-center cursor-pointer transition-colors duration-200"
                        onClick={() => { setMagicLinkStep('email'); setOtpCode(''); setOtpError('') }}
                      >
                        Use a different email
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Input
                        placeholder="Enter your email"
                        type="email"
                        value={magicLinkEmail}
                        onChange={(event) => setMagicLinkEmail(event.target.value)}
                        className="h-11 rounded-xl border-border/60 dark:border-white/10 focus:ring-2 focus:ring-offset-0 transition-all duration-200 placeholder:text-muted-foreground/50"
                        style={{ '--tw-ring-color': `${accentColor}30` } as React.CSSProperties}
                      />
                      {otpError && (
                        <p className="text-xs text-red-500 text-center font-medium">{otpError}</p>
                      )}
                      <Button
                        className="w-full h-11 rounded-xl font-semibold text-white cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                        onClick={handleMagicLinkSend}
                        disabled={!magicLinkEmail || otpLoading}
                        style={{
                          backgroundColor: accentColor,
                          boxShadow: `0 4px 14px -3px ${accentColor}40`
                        }}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        {otpLoading ? 'Sending...' : 'Continue with Email'}
                      </Button>
                      <OrDivider />
                      {oauthError && (
                        <p className="text-xs text-red-500 text-center font-medium">{oauthError}</p>
                      )}
                      <div className="flex gap-2.5">
                        <Button
                          variant="outline"
                          className="w-full h-11 rounded-xl font-medium border-border/60 dark:border-white/10 hover:bg-muted/50 dark:hover:bg-white/5 hover:shadow-sm transition-all duration-200 cursor-pointer"
                          onClick={() => handleSocialClick('google')}
                        >
                          <GoogleIcon />
                          <span className="ml-2">Google</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : loginHandler === 'customer' ? (
                // Show "Login" button -> redirect to ssoRedirectUrl
                <div className="space-y-4">
                  <div className="text-center py-2">
                    <div className="w-12 h-12 rounded-2xl bg-muted/50 dark:bg-white/5 flex items-center justify-center mx-auto mb-3">
                      <LogIn className="h-6 w-6 text-muted-foreground/60" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">
                      Please login to submit feedback
                    </p>
                  </div>
                  <Button
                    className="w-full h-11 rounded-xl font-semibold text-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                    onClick={handleCustomerLogin}
                    style={{
                      backgroundColor: accentColor,
                      boxShadow: `0 4px 14px -3px ${accentColor}40`
                    }}
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Login with {orgName || 'your account'}
                  </Button>
                </div>
              ) : (
                // No login handler configured
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-2xl bg-muted/50 dark:bg-white/5 flex items-center justify-center mx-auto mb-3">
                    <LogIn className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Please login to your account first
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {(identifiedUser || guestEmail) && (
            <div className="text-sm text-foreground/80 bg-muted/30 dark:bg-white/5 px-4 py-3 rounded-xl border border-border/40 dark:border-white/8 flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
                style={{ backgroundColor: accentColor }}
              >
                {(identifiedUser?.name || identifiedUser?.email || guestName || guestEmail || '?').charAt(0).toUpperCase()}
              </div>
              Posting as <span className="font-semibold text-foreground">{identifiedUser?.name || identifiedUser?.email || guestName || guestEmail}</span>
            </div>
          )}
          {boards.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/70">Board</label>
              <Select value={selectedBoard} onValueChange={setSelectedBoard}>
                <SelectTrigger className="h-11 rounded-xl border-border/60 dark:border-white/10 text-sm cursor-pointer transition-all duration-200 hover:border-border">
                  <SelectValue placeholder="Select a board" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {boards.map((board) => (
                    <SelectItem key={board.id} value={board.id} className="cursor-pointer rounded-lg">
                      {board.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/70">Title</label>
            <Input
              placeholder="Short, descriptive title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="h-11 rounded-xl border-border/60 dark:border-white/10 text-sm placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-offset-0 transition-all duration-200"
              style={{ '--tw-ring-color': `${accentColor}30` } as React.CSSProperties}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/70">
              Description
              <span className="text-muted-foreground/50 font-normal ml-1">(optional)</span>
            </label>
            <Textarea
              placeholder="Tell us more about your idea..."
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={4}
              className="rounded-xl border-border/60 dark:border-white/10 text-sm placeholder:text-muted-foreground/50 resize-none focus:ring-2 focus:ring-offset-0 transition-all duration-200 min-h-[100px]"
              style={{ '--tw-ring-color': `${accentColor}30` } as React.CSSProperties}
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !title.trim()}
            style={{
              backgroundColor: accentColor,
              boxShadow: `0 4px 14px -3px ${accentColor}40`
            }}
            className="w-full h-11 text-white rounded-xl text-sm font-semibold cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {loading ? 'Submitting...' : 'Submit'}
          </Button>
          {success === 'pending' && (
            <div className="flex items-start gap-3 bg-amber-50/80 dark:bg-amber-950/20 px-4 py-3.5 rounded-xl border border-amber-200/60 dark:border-amber-800/40">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
                Your post has been submitted and is waiting for admin approval.
              </p>
            </div>
          )}
          {success === true && (
            <div className="flex items-start gap-3 bg-emerald-50/80 dark:bg-emerald-950/20 px-4 py-3.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 leading-relaxed">
                Thanks for the feedback!
              </p>
            </div>
          )}
          {submitError && (
            <div className="flex items-start gap-3 bg-red-50/80 dark:bg-red-950/20 px-4 py-3.5 rounded-xl border border-red-200/60 dark:border-red-800/40">
              <p className="text-sm text-red-600 dark:text-red-400 leading-relaxed">
                {submitError}
              </p>
            </div>
          )}
        </form>
      )}

      {showBranding && (
        <div className="text-xs text-muted-foreground/40 text-center font-medium pt-1">Powered by Kelo</div>
      )}
    </div>
  )
}
