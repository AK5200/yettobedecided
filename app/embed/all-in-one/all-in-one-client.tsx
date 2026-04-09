'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { AllInOneWidget } from '@/components/widgets/all-in-one-widget'
import { FeedbackWidget } from '@/components/widgets/feedback-widget'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Mail, Shield } from 'lucide-react'
import { applyWidgetTheme, getWidgetAccent, getEmbeddedWidgetData } from '@/lib/widget-theme'

// Read embedded data immediately (before component mounts)
const _embeddedData = getEmbeddedWidgetData()

export default function AllInOneEmbedClient() {
  const searchParams = useSearchParams()
  const org = searchParams.get('org')
  const detectedAccent = getWidgetAccent()

  useEffect(() => { applyWidgetTheme() }, [])
  const [boards, setBoards] = useState<{ id: string; name: string }[]>(_embeddedData?.boards || [])
  const [posts, setPosts] = useState<any[]>(() => {
    if (!_embeddedData?.posts) return []
    // Read voted post IDs from sessionStorage to persist vote state across refreshes
    // Note: org from useSearchParams is null during useState init, so read from URL directly
    let votedIds: Set<string> = new Set()
    try {
      const urlOrg = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('org') : null
      const stored = urlOrg && typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(`kelo_votes_${urlOrg}`) : null
      if (stored) votedIds = new Set(JSON.parse(stored))
    } catch {}
    return _embeddedData.posts.map((p: any) => ({
      id: p.id, title: p.title, content: p.content || '',
      votes: p.vote_count || 0, author_name: p.author_name || p.guest_name || 'Anonymous',
      author_email: p.author_email || p.guest_email, tags: p.tags || [],
      status: p.status || 'open', hasVoted: votedIds.has(p.id),
    }))
  })
  const [changelog, setChangelog] = useState<any[]>(_embeddedData?.changelog || [])
  const [settings, setSettings] = useState<any>(_embeddedData?.settings || null)
  const [auth, setAuth] = useState<any>(_embeddedData?.auth || null)
  const [loading, setLoading] = useState(!_embeddedData)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [identifiedUser, setIdentifiedUser] = useState<any>(null)

  // Read identified user from localStorage on mount, fallback to widget_session cookie
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`kelo_identified_user_${org}`)
      if (stored) {
        setIdentifiedUser(JSON.parse(stored))
        return
      }
    } catch {}

    // Check widget_session cookie for shared auth
    fetch('/api/auth/widget/session')
      .then(r => r.json())
      .then(data => {
        if (data.user?.email) {
          setIdentifiedUser(data.user)
          try {
            localStorage.setItem(`kelo_identified_user_${org}`, JSON.stringify(data.user))
          } catch {}
        }
      })
      .catch(() => {})
  }, [org])

  const applyWidgetData = useCallback((data: any) => {
    if (!data) return
    setBoards(data.boards || [])
    setChangelog(data.changelog || [])
    setSettings(data.settings || {})
    if (data.auth) setAuth(data.auth)

    if (data.posts && Array.isArray(data.posts) && data.posts.length > 0) {
      let votedPostIds: Set<string> = new Set()
      try {
        const stored = sessionStorage.getItem(`kelo_votes_${org}`)
        if (stored) votedPostIds = new Set(JSON.parse(stored))
      } catch {}

      const formattedPosts = data.posts.map((p: any) => ({
        id: p.id,
        title: p.title,
        content: p.content || '',
        votes: p.vote_count || 0,
        author_name: p.author_name || p.guest_name || 'Anonymous',
        author_email: p.author_email || p.guest_email,
        tags: p.tags || [],
        status: p.status || 'open',
        hasVoted: votedPostIds.has(p.id),
      }))
      setPosts(formattedPosts)
    }
    setLoading(false)
  }, [org])

  // Listen for data + identity from parent via postMessage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'kelo:identity') {
        const user = event.data.user
        if (user) {
          setIdentifiedUser(user)
          try {
            localStorage.setItem(`kelo_identified_user_${org}`, JSON.stringify(user))
          } catch {}
        }
      }
      if (event.data && event.data.type === 'kelo:data') {
        applyWidgetData(event.data.data)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [org, applyWidgetData])

  // Fallback: fetch data if not received via postMessage within 1s
  useEffect(() => {
    if (!org) {
      setLoading(false)
      return
    }

    const timer = setTimeout(async () => {
      // If data was already received via postMessage, skip
      if (settings) return

      try {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        const res = await fetch(`${baseUrl}/api/widget?org=${encodeURIComponent(org)}`)
        if (res.ok) {
          applyWidgetData(await res.json())
        }
      } catch (error) {
        console.error('Failed to fetch widget data:', error)
        setLoading(false)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [org])

  // Revert an optimistic vote UI update (called when API fails or no email)
  const revertVote = useCallback((postId: string) => {
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, hasVoted: !p.hasVoted, votes: p.hasVoted ? p.votes - 1 : p.votes + 1 }
        : p
    ))
  }, [])

  // Get or create anonymous voter ID for guest voting
  const getAnonVoterId = useCallback(() => {
    try {
      let anonId = localStorage.getItem('kelo_anon_voter')
      if (!anonId) {
        anonId = 'anon_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
        localStorage.setItem('kelo_anon_voter', anonId)
      }
      return anonId
    } catch {
      return 'anon_' + Math.random().toString(36).substring(2)
    }
  }, [])

  const handleVote = useCallback(async (postId: string) => {
    // Use identified email if available, otherwise use anonymous voter ID
    const voterId = identifiedUser?.email || getAnonVoterId()

    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const res = await fetch(`${baseUrl}/api/widget/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, email: voterId }),
      })

      if (res.ok) {
        const data = await res.json()
        // Persist vote state in sessionStorage so hasVoted is correct on next load
        try {
          const storageKey = `kelo_votes_${org}`
          const stored = sessionStorage.getItem(storageKey)
          let votedIds: string[] = stored ? JSON.parse(stored) : []
          if (data.voted) {
            if (!votedIds.includes(postId)) votedIds.push(postId)
          } else {
            votedIds = votedIds.filter((id: string) => id !== postId)
          }
          sessionStorage.setItem(storageKey, JSON.stringify(votedIds))
        } catch {}
      } else {
        // API returned error — revert optimistic update
        revertVote(postId)
      }
    } catch (error) {
      console.error('Vote failed:', error)
      revertVote(postId)
    }
  }, [identifiedUser, org, revertVote, getAnonVoterId])

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center" style={{ pointerEvents: 'auto' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto mb-2"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!org) {
    return <div className="p-4 text-sm">Missing org parameter.</div>
  }

  const autoTheme = new URLSearchParams(window.location.search).get('theme') !== null
  const autoOverride = autoTheme || detectedAccent !== null
  const accentColor = detectedAccent || settings?.accent_color || '#F59E0B'
  const backgroundColor = autoOverride ? undefined : (settings?.background_color || '#ffffff')
  const headerBackgroundColor = autoOverride ? undefined : (settings?.header_background_color || settings?.background_color || '#ffffff')
  const showBranding = settings?.show_branding !== false
  const heading = settings?.heading || 'Have something to say?'
  const subheading = settings?.subheading || 'Suggest a feature, read through our feedback and check out our latest feature releases.'
  const textStyle = settings?.all_in_one_text_style || 'default'
  const styleVariant = String(settings?.all_in_one_style_variant || searchParams.get('style') || '1') as '1' | '2' | '3'
  const borderRadius = settings?.border_radius || 'medium'

  const handleCreatePost = () => {
    setShowFeedbackForm(true)
  }

  const handleFeedbackSubmit = async (post?: any) => {
    // Re-read identified user from sessionStorage (user may have just authenticated in the feedback form)
    try {
      const stored = localStorage.getItem(`kelo_identified_user_${org}`)
      if (stored) {
        setIdentifiedUser(JSON.parse(stored))
      }
    } catch {
      // Ignore storage errors
    }

    // Add the new post to the list only if approved (not in moderation)
    if (post && post.is_approved !== false) {
      const newPost = {
        id: post.id,
        title: post.title,
        content: post.content || '',
        votes: post.vote_count || 0,
        author_name: post.author_name || post.guest_name || 'Anonymous',
        author_email: post.author_email || post.guest_email,
        tags: post.tags || [],
        status: post.status || 'open',
        hasVoted: false,
      }
      setPosts((prev) => [newPost, ...prev])
    }

    setShowFeedbackForm(false)
  }

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage('kelo:close', '*')
    }
  }

  return (
    <div
      className="w-full h-full relative flex flex-col bg-white dark:bg-[#1a1a1a]"
      style={{
        pointerEvents: 'auto',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        backgroundColor,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        margin: 0,
        padding: 0,
      }}
    >
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors z-50 bg-white dark:bg-[#1a1a1a] shadow-sm"
        aria-label="Close"
      >
        <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
      </button>

      <div className="flex-1 overflow-y-auto w-full h-full">
        <AllInOneWidget
          boards={boards}
          posts={posts}
          changelog={changelog}
          orgSlug={org || ''}
          accentColor={accentColor}
          backgroundColor={backgroundColor}
          headerBackgroundColor={headerBackgroundColor}
          showBranding={showBranding}
          heading={heading}
          subheading={subheading}
          textStyle={textStyle}
          styleVariant={styleVariant}
          borderRadius={borderRadius}
          isEmbedded={true}
          onCreatePost={handleCreatePost}
          onVote={handleVote}
          identifiedUser={identifiedUser}
          onPostsChange={setPosts}
          guestCommentingEnabled={auth?.guestCommentingEnabled !== false}
          guestVotingEnabled={auth?.guestVotingEnabled !== false}
          onLoginRequired={() => setShowLoginDialog(true)}
        />
      </div>

      <Dialog open={showFeedbackForm} onOpenChange={setShowFeedbackForm}>
        <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
          <FeedbackWidget
            boards={boards}
            orgSlug={org || ''}
            accentColor={accentColor}
            showBranding={showBranding}
            onSubmit={handleFeedbackSubmit}
          />
        </DialogContent>
      </Dialog>

      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        orgSlug={org || ''}
        accentColor={accentColor}
        onVerified={(user) => {
          setIdentifiedUser(user)
          try { localStorage.setItem(`kelo_identified_user_${org}`, JSON.stringify(user)) } catch {}
          setShowLoginDialog(false)
        }}
      />
    </div>
  )
}

// Google icon
function GoogleIcon() {
  return (
    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function LoginDialog({ open, onOpenChange, orgSlug, accentColor, onVerified }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgSlug: string
  accentColor: string
  onVerified: (user: any) => void
}) {
  const [step, setStep] = useState<'options' | 'email' | 'code'>('options')
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendCode = async () => {
    if (!email) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/widget/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, org_slug: orgSlug }),
      })
      if (res.ok) {
        const data = await res.json()
        setToken(data.token || '')
        setStep('code')
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to send code')
      }
    } catch {
      setError('Failed to send code')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (otpCode.length !== 6) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/widget/magic-link', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, code: otpCode }),
      })
      if (res.ok) {
        onVerified({ email, name: email.split('@')[0] })
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Invalid code')
      }
    } catch {
      setError('Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = () => {
    const popup = window.open(
      `/api/auth/widget/callback?provider=google&org=${orgSlug}`,
      'kelo-oauth', 'width=500,height=600,left=200,top=100'
    )
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'kelo:oauth-success' && event.data.user) {
        onVerified(event.data.user)
        window.removeEventListener('message', handler)
      }
    }
    window.addEventListener('message', handler)
  }

  // Reset when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) { setStep('options'); setEmail(''); setOtpCode(''); setError('') }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" style={{ color: accentColor }} />
            Verify your identity
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          {step === 'code' ? (
            <>
              <p className="text-sm text-muted-foreground text-center">
                Enter the 6-digit code sent to <strong className="text-foreground">{email}</strong>
              </p>
              <Input
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="h-11 text-center text-2xl tracking-[0.3em] font-mono rounded-xl"
                maxLength={6}
                autoFocus
              />
              {error && <p className="text-xs text-red-500 text-center">{error}</p>}
              <Button
                onClick={handleVerifyCode}
                disabled={otpCode.length !== 6 || loading}
                className="w-full h-11 rounded-xl font-semibold text-white"
                style={{ backgroundColor: accentColor }}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </Button>
              <button
                className="text-xs text-muted-foreground/50 hover:text-muted-foreground w-full text-center cursor-pointer"
                onClick={() => { setStep('email'); setOtpCode(''); setError('') }}
              >
                Use a different email
              </button>
            </>
          ) : step === 'email' ? (
            <>
              <Input
                placeholder="Enter your email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl"
                autoFocus
              />
              {error && <p className="text-xs text-red-500 text-center">{error}</p>}
              <Button
                onClick={handleSendCode}
                disabled={!email || loading}
                className="w-full h-11 rounded-xl font-semibold text-white"
                style={{ backgroundColor: accentColor }}
              >
                <Mail className="h-4 w-4 mr-2" />
                {loading ? 'Sending...' : 'Send Verification Code'}
              </Button>
              <button
                className="text-xs text-muted-foreground/50 hover:text-muted-foreground w-full text-center cursor-pointer"
                onClick={() => setStep('options')}
              >
                Back
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground text-center">
                Verify your identity to continue
              </p>
              <Button
                onClick={() => setStep('email')}
                variant="outline"
                className="w-full h-11 rounded-xl font-medium"
              >
                <Mail className="h-4 w-4 mr-2" />
                Continue with Email
              </Button>
              <Button
                onClick={handleGoogle}
                variant="outline"
                className="w-full h-11 rounded-xl font-medium"
              >
                <GoogleIcon />
                Continue with Google
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
