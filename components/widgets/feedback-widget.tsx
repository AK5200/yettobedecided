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
import { Check } from 'lucide-react'

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
  const [success, setSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [identifiedUser, setIdentifiedUser] = useState<any>(null)
  const [isIdentified, setIsIdentified] = useState(false)
  const [guestPostingEnabled, setGuestPostingEnabled] = useState(true)
  const [loginHandler, setLoginHandler] = useState<'feedbackhub' | 'customer' | null>(null)
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
      if (event.data && event.data.type === 'feedbackhub:identity') {
        const user = event.data.user
        if (user) {
          setIsIdentified(true)
          setIdentifiedUser(user)
          // Store in sessionStorage for persistence (scoped per org)
          try {
            sessionStorage.setItem(`feedbackhub_identified_user_${orgSlug}`, JSON.stringify(user))
          } catch (e) {
            // Ignore storage errors
          }
        }
      }
    }

    window.addEventListener('message', handleMessage)

    // Check sessionStorage for existing identity (scoped per org)
    try {
      const stored = sessionStorage.getItem(`feedbackhub_identified_user_${orgSlug}`)
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
          const parentHub = (window.parent as any)?.FeedbackHub
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
    // Also try to identify in parent if possible
    try {
      if (window.parent && window.parent !== window) {
        try {
          const parentHub = (window.parent as any)?.FeedbackHub
          if (parentHub?.identify) {
            parentHub.identify({ id: email, email, name })
            setIdentifiedUser(parentHub.getUser ? parentHub.getUser() : null)
          }
        } catch (e) {
          // Cross-origin error - ignore
        }
      }
    } catch (error) {
      // Silently handle any errors
    }
  }

  const handleSocialClick = (provider: 'google' | 'github') => {
    setOauthError('')
    const url = `/api/auth/widget/${provider}?org_slug=${encodeURIComponent(orgSlug)}&popup=1`
    const popup = window.open(url, 'feedbackhub_oauth', 'width=500,height=600,scrollbars=yes')

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
      if (event.data && event.data.type === 'feedbackhub:oauth-success') {
        clearTimeout(timeoutId)
        window.removeEventListener('message', oauthMessageHandler)
        const user = event.data.user
        if (user) {
          setIdentifiedUser(user)
          setIsIdentified(true)
          try {
            sessionStorage.setItem(`feedbackhub_identified_user_${orgSlug}`, JSON.stringify(user))
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

    const redirectUrl = `${ssoRedirectUrl}?redirect=${encodeURIComponent(parentUrl)}&feedbackhub=open`

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
        sessionStorage.setItem(`feedbackhub_identified_user_${orgSlug}`, JSON.stringify(user))
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
            const parentHub = (window.parent as any)?.FeedbackHub
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
        setSuccess(true)
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
      <div className="text-sm text-gray-500 text-center py-4">Loading...</div>
    )
  }

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
                  className="border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100"
                />
                <Input
                  placeholder="Name (optional)"
                  value={guestName}
                  onChange={(event) => setGuestName(event.target.value)}
                  className="border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100"
                />
                <Button
                  className="w-full font-semibold shadow-sm hover:shadow-md transition-all cursor-pointer"
                  onClick={() => handleGuestSubmit(guestEmail, guestName)}
                  disabled={!guestEmail}
                  style={{ 
                    backgroundColor: accentColor,
                    boxShadow: `0 2px 8px -2px ${accentColor}40`
                  }}
                >
                  Continue
                </Button>
              </div>
              
              {/* Show login options below if login handler is configured */}
              {loginHandler === 'feedbackhub' && (
                <>
                  <div className="text-xs text-gray-500 text-center font-medium relative">
                    <span className="bg-white px-2 relative z-10">or verify your email</span>
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                  </div>
                  {magicLinkStep === 'code' ? (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-500 text-center">
                        Enter the 6-digit code sent to <strong>{magicLinkEmail}</strong>
                      </p>
                      <Input
                        placeholder="000000"
                        value={otpCode}
                        onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="text-center text-2xl tracking-widest font-mono border-gray-200"
                        maxLength={6}
                        autoFocus
                      />
                      {otpError && (
                        <p className="text-xs text-red-500 text-center">{otpError}</p>
                      )}
                      <Button
                        className="w-full font-semibold cursor-pointer"
                        onClick={handleMagicLinkVerify}
                        disabled={otpCode.length !== 6 || otpLoading}
                        style={{ backgroundColor: accentColor }}
                      >
                        {otpLoading ? 'Verifying...' : 'Verify Code'}
                      </Button>
                      <button
                        className="text-xs text-gray-400 hover:text-gray-600 w-full text-center cursor-pointer"
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
                        className="border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100"
                      />
                      {otpError && (
                        <p className="text-xs text-red-500 text-center">{otpError}</p>
                      )}
                      <Button
                        variant="outline"
                        className="w-full font-semibold cursor-pointer"
                        onClick={handleMagicLinkSend}
                        disabled={!magicLinkEmail || otpLoading}
                      >
                        {otpLoading ? 'Sending...' : 'Send Verification Code'}
                      </Button>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 text-center font-medium relative">
                    <span className="bg-white px-2 relative z-10">or</span>
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                  </div>
                  {oauthError && (
                    <p className="text-xs text-red-500 text-center">{oauthError}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleSocialClick('google')}
                    >
                      Google
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleSocialClick('github')}
                    >
                      GitHub
                    </Button>
                  </div>
                </>
              )}
              {loginHandler === 'customer' && (
                <>
                  <div className="text-xs text-gray-500 text-center font-medium relative">
                    <span className="bg-white px-2 relative z-10">or</span>
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleCustomerLogin}
                  >
                    Login with {orgName || 'your account'}
                  </Button>
                </>
              )}
            </>
          ) : (
            // Guest posting disabled - must login
            <>
              {loginHandler === 'feedbackhub' ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 text-center">
                    Please login to submit feedback
                  </p>
                  {magicLinkStep === 'code' ? (
                    <>
                      <p className="text-xs text-gray-500 text-center">
                        Enter the 6-digit code sent to <strong>{magicLinkEmail}</strong>
                      </p>
                      <Input
                        placeholder="000000"
                        value={otpCode}
                        onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="text-center text-2xl tracking-widest font-mono border-gray-200"
                        maxLength={6}
                        autoFocus
                      />
                      {otpError && (
                        <p className="text-xs text-red-500 text-center">{otpError}</p>
                      )}
                      <Button
                        className="w-full font-semibold cursor-pointer"
                        onClick={handleMagicLinkVerify}
                        disabled={otpCode.length !== 6 || otpLoading}
                        style={{ backgroundColor: accentColor }}
                      >
                        {otpLoading ? 'Verifying...' : 'Verify Code'}
                      </Button>
                      <button
                        className="text-xs text-gray-400 hover:text-gray-600 w-full text-center cursor-pointer"
                        onClick={() => { setMagicLinkStep('email'); setOtpCode(''); setOtpError('') }}
                      >
                        Use a different email
                      </button>
                    </>
                  ) : (
                    <>
                      <Input
                        placeholder="Enter your email"
                        type="email"
                        value={magicLinkEmail}
                        onChange={(event) => setMagicLinkEmail(event.target.value)}
                        className="border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100"
                      />
                      {otpError && (
                        <p className="text-xs text-red-500 text-center">{otpError}</p>
                      )}
                      <Button
                        className="w-full font-semibold cursor-pointer"
                        onClick={handleMagicLinkSend}
                        disabled={!magicLinkEmail || otpLoading}
                        style={{
                          backgroundColor: accentColor,
                          boxShadow: `0 2px 8px -2px ${accentColor}40`
                        }}
                      >
                        {otpLoading ? 'Sending...' : 'Continue with Email'}
                      </Button>
                      <div className="text-xs text-gray-500 text-center font-medium relative">
                        <span className="bg-white px-2 relative z-10">or</span>
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-200"></div>
                        </div>
                      </div>
                      {oauthError && (
                        <p className="text-xs text-red-500 text-center">{oauthError}</p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleSocialClick('google')}
                        >
                          Google
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleSocialClick('github')}
                        >
                          GitHub
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ) : loginHandler === 'customer' ? (
                // Show "Login" button → redirect to ssoRedirectUrl
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 text-center">
                    Please login to submit feedback
                  </p>
                  <Button
                    className="w-full"
                    onClick={handleCustomerLogin}
                    style={{ 
                      backgroundColor: accentColor,
                      boxShadow: `0 2px 8px -2px ${accentColor}40`
                    }}
                  >
                    Login with {orgName || 'your account'}
                  </Button>
                </div>
              ) : (
                // No login handler configured
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600">
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
          {boards.length > 1 && (
            <Select value={selectedBoard} onValueChange={setSelectedBoard}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a board" />
              </SelectTrigger>
              <SelectContent>
                {boards.map((board) => (
                  <SelectItem key={board.id} value={board.id}>
                    {board.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {(identifiedUser || guestEmail) && (
            <div className="text-sm text-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 rounded-xl border-2 border-gray-200 shadow-sm">
              Posting as <span className="font-bold">{identifiedUser?.name || identifiedUser?.email || guestName || guestEmail}</span>
            </div>
          )}
          <Input
            placeholder="Feedback title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="border-2 border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 h-12 text-base font-medium shadow-sm"
            required
          />
          <Textarea
            placeholder="Describe your feedback..."
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="resize-none overflow-y-auto border-2 border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 shadow-sm"
            style={{
              maxHeight: '200px',
            }}
          />
          <Button
            type="submit"
            disabled={loading || !title.trim()}
            style={{ 
              backgroundColor: accentColor,
              boxShadow: `0 6px 20px -4px ${accentColor}60`
            }}
            className="text-white font-bold text-base py-6 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </Button>
          {success && (
            <p className="text-sm text-green-600 flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
              <Check className="h-4 w-4" />
              Thanks for the feedback!
            </p>
          )}
          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
              {submitError}
            </p>
          )}
        </form>
      )}

      {showBranding && (
        <div className="text-xs text-gray-500 text-center">Powered by FeedbackHub</div>
      )}
    </div>
  )
}
