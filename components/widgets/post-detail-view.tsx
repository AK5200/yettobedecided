'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, ChevronUp, Send, Shield, Mail } from 'lucide-react'

interface Comment {
  id: string
  content: string
  author_name?: string
  author_email?: string
  guest_name?: string
  created_at: string
}

interface PostDetail {
  id: string
  title: string
  content: string
  votes: number
  author_name?: string
  author_email?: string
  tags?: { name: string }[]
  hasVoted?: boolean
  created_at?: string
}

interface PostDetailViewProps {
  post: PostDetail
  orgSlug: string
  accentColor?: string
  onBack: () => void
  onVote?: (postId: string) => void
  identifiedUser?: any
  guestCommentingEnabled?: boolean
}

export function PostDetailView({ post: initialPost, orgSlug, accentColor = '#F59E0B', onBack, onVote, identifiedUser: identifiedUserProp, guestCommentingEnabled = true }: PostDetailViewProps) {
  const [post, setPost] = useState<PostDetail>(initialPost)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [identifiedUser, setIdentifiedUser] = useState<any>(identifiedUserProp || null)
  const [commentEmail, setCommentEmail] = useState('')
  const [commentName, setCommentName] = useState('')
  const [showVerify, setShowVerify] = useState(false)
  const [verifyEmail, setVerifyEmail] = useState('')
  const [verifyStep, setVerifyStep] = useState<'options' | 'email' | 'code'>('options')
  const [otpCode, setOtpCode] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [verificationToken, setVerificationToken] = useState('')

  useEffect(() => { setPost(initialPost) }, [initialPost])

  useEffect(() => {
    if (identifiedUserProp) setIdentifiedUser(identifiedUserProp)
  }, [identifiedUserProp])

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        const res = await fetch(`${baseUrl}/api/comments?post_id=${post.id}`)
        if (res.ok) {
          const data = await res.json()
          setComments(data.comments || [])
        }
      } catch (error) {
        console.error('Failed to fetch comments:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchComments()

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'kelo:identity') {
        const user = event.data.user
        if (user) {
          setIdentifiedUser(user)
          try { localStorage.setItem(`kelo_identified_user_${orgSlug}`, JSON.stringify(user)) } catch {}
        }
      }
    }
    window.addEventListener('message', handleMessage)

    if (!identifiedUserProp) {
      try {
        const stored = localStorage.getItem(`kelo_identified_user_${orgSlug}`)
        if (stored) setIdentifiedUser(JSON.parse(stored))
      } catch {}
    }

    return () => window.removeEventListener('message', handleMessage)
  }, [post.id, identifiedUserProp])

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    try {
      return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: '2-digit', timeZone: 'UTC' }).format(new Date(dateString))
    } catch { return '' }
  }

  const handleVerifyEmailSend = async () => {
    if (!verifyEmail) return
    setOtpLoading(true)
    setOtpError('')
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const res = await fetch(`${baseUrl}/api/auth/widget/magic-link`, {
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
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const res = await fetch(`${baseUrl}/api/auth/widget/magic-link`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationToken, code: otpCode }),
      })
      if (res.ok) {
        const userData = { email: verifyEmail, name: commentName || verifyEmail.split('@')[0] }
        setIdentifiedUser(userData)
        try { localStorage.setItem(`kelo_identified_user_${orgSlug}`, JSON.stringify(userData)) } catch {}
        setShowVerify(false)
        setVerifyStep('options')
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
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const popup = window.open(
      `${baseUrl}/api/auth/widget/callback?provider=google&org=${orgSlug}`,
      'kelo-oauth', 'width=500,height=600,left=200,top=100'
    )
    const handleOAuth = (event: MessageEvent) => {
      if (event.data && event.data.type === 'kelo:oauth-success') {
        const user = event.data.user
        if (user) {
          setIdentifiedUser(user)
          try { localStorage.setItem(`kelo_identified_user_${orgSlug}`, JSON.stringify(user)) } catch {}
          setShowVerify(false)
        }
        window.removeEventListener('message', handleOAuth)
      }
    }
    window.addEventListener('message', handleOAuth)
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submitting) return
    const email = identifiedUser?.email || commentEmail || null
    const name = identifiedUser?.name || commentName
    if (!name && !email) return

    const content = newComment.trim()
    const tempId = `temp-${Date.now()}`
    const optimisticComment: Comment = { id: tempId, content, author_name: name || undefined, author_email: email, created_at: new Date().toISOString() }
    setComments((prev) => [...prev, optimisticComment])
    setNewComment('')

    setSubmitting(true)
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const res = await fetch(`${baseUrl}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: post.id, content, guest_email: email, guest_name: name }),
      })
      if (res.ok) {
        const data = await res.json()
        setComments((prev) => prev.map((c) => c.id === tempId ? data.comment : c))
      } else {
        setComments((prev) => prev.filter((c) => c.id !== tempId))
      }
    } catch {
      setComments((prev) => prev.filter((c) => c.id !== tempId))
    } finally {
      setSubmitting(false)
    }
  }

  const handleVote = () => {
    setPost((prev) => ({ ...prev, votes: prev.hasVoted ? prev.votes - 1 : prev.votes + 1, hasVoted: !prev.hasVoted }))
    onVote?.(post.id)
  }

  const canSubmitComment = newComment.trim() && (identifiedUser?.name || identifiedUser?.email || commentName)

  return (
    <div className="flex flex-col h-full">
      {/* Header: back + title + vote — compact */}
      <div className="px-5 pt-4 pb-4 border-b border-border/40 dark:border-white/8 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-all duration-200 mb-3 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>

        <div className="flex items-start gap-3">
          {/* Compact vote button */}
          <button
            onClick={handleVote}
            className={`flex flex-col items-center justify-center w-11 h-11 rounded-xl border transition-all duration-200 shrink-0 cursor-pointer hover:shadow-sm active:scale-95 ${
              post.hasVoted
                ? 'border-transparent text-white'
                : 'border-border/60 text-muted-foreground hover:border-border bg-muted/20 dark:bg-white/5'
            }`}
            style={post.hasVoted ? { backgroundColor: accentColor, boxShadow: `0 4px 12px -2px ${accentColor}50` } : {}}
          >
            <ChevronUp className="h-3.5 w-3.5 -mb-0.5" />
            <span className="text-xs font-bold">{post.votes}</span>
          </button>

          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-snug">{post.title}</h2>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground/60">
              {post.author_name && (
                <span className="font-medium text-muted-foreground">{post.author_name}</span>
              )}
              {post.created_at && <span>{formatDate(post.created_at)}</span>}
            </div>
          </div>
        </div>

        {/* Post content */}
        {post.content && (
          <p className="text-sm text-foreground/70 mt-3 leading-relaxed whitespace-pre-wrap">{post.content}</p>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {post.tags.map((tag) => (
              <span key={tag.name} className="px-2 py-0.5 bg-muted/50 dark:bg-white/8 rounded-full text-[10px] font-medium text-muted-foreground">
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Comments — scrollable, takes remaining space */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider mb-3">
          Comments {comments.length > 0 && `(${comments.length})`}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground/40 text-sm">
            No comments yet. Be the first!
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 group">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: accentColor }}
                >
                  {(comment.author_name || comment.guest_name || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-foreground">
                      {comment.author_name || comment.guest_name || 'Anonymous'}
                    </span>
                    <span className="text-[10px] text-muted-foreground/40">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/70 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comment form — pinned at bottom */}
      <div className="px-5 py-3 border-t border-border/40 dark:border-white/8 shrink-0 bg-background dark:bg-[#1a1a1a]">
        {/* If guest commenting is OFF and user not verified — show login prompt */}
        {!guestCommentingEnabled && !identifiedUser ? (
          <div className="space-y-2.5">
            <p className="text-xs text-muted-foreground text-center">Verify your identity to comment</p>
            {showVerify ? (
              <div className="p-3 rounded-lg border border-border/40 dark:border-white/8 bg-muted/20 dark:bg-white/3 space-y-2.5">
                {verifyStep === 'code' ? (
                  <>
                    <p className="text-[11px] text-muted-foreground text-center">
                      Code sent to <strong className="text-foreground">{verifyEmail}</strong>
                    </p>
                    <Input
                      placeholder="000000"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="h-9 text-center text-lg tracking-[0.25em] font-mono rounded-lg border-border/50 dark:border-white/10"
                      maxLength={6}
                      autoFocus
                    />
                    {otpError && <p className="text-[11px] text-red-500 text-center">{otpError}</p>}
                    <Button
                      type="button"
                      onClick={handleVerifyCode}
                      disabled={otpCode.length !== 6 || otpLoading}
                      style={{ backgroundColor: accentColor }}
                      className="w-full h-8 text-xs text-white rounded-lg font-semibold cursor-pointer disabled:opacity-40"
                    >
                      {otpLoading ? 'Verifying...' : 'Verify'}
                    </Button>
                  </>
                ) : verifyStep === 'email' ? (
                  <>
                    <Input
                      placeholder="Your email"
                      type="email"
                      value={verifyEmail}
                      onChange={(e) => setVerifyEmail(e.target.value)}
                      className="h-9 text-sm rounded-lg border-border/50 dark:border-white/10"
                      autoFocus
                    />
                    {otpError && <p className="text-[11px] text-red-500 text-center">{otpError}</p>}
                    <Button
                      type="button"
                      onClick={handleVerifyEmailSend}
                      disabled={!verifyEmail || otpLoading}
                      variant="outline"
                      className="w-full h-8 text-xs rounded-lg font-medium cursor-pointer border-border/50 dark:border-white/10"
                    >
                      <Mail className="h-3 w-3 mr-1.5" />
                      {otpLoading ? 'Sending...' : 'Send code'}
                    </Button>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Button
                      type="button"
                      onClick={() => setVerifyStep('email')}
                      variant="outline"
                      className="w-full h-8 text-xs rounded-lg font-medium cursor-pointer border-border/50 dark:border-white/10"
                    >
                      <Mail className="h-3 w-3 mr-1.5" />
                      Verify with email
                    </Button>
                    <Button
                      type="button"
                      onClick={handleGoogleVerify}
                      variant="outline"
                      className="w-full h-8 text-xs rounded-lg font-medium cursor-pointer border-border/50 dark:border-white/10"
                    >
                      <svg className="h-3 w-3 mr-1.5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                      Continue with Google
                    </Button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => { setShowVerify(false); setVerifyStep('options'); setOtpError('') }}
                  className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground w-full text-center cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <Button
                type="button"
                onClick={() => setShowVerify(true)}
                variant="outline"
                className="w-full h-9 text-xs rounded-lg font-medium cursor-pointer border-border/50 dark:border-white/10"
              >
                <Shield className="h-3.5 w-3.5 mr-1.5" />
                Login to comment
              </Button>
            )}
          </div>
        ) : (
        <form onSubmit={handleSubmitComment} className="space-y-2.5">
          {!identifiedUser && guestCommentingEnabled && (
            <div className="space-y-1.5">
              <Input
                placeholder="Your name"
                value={commentName}
                onChange={(e) => setCommentName(e.target.value)}
                className="h-9 text-sm rounded-lg border-border/50 dark:border-white/10 focus:ring-1 focus:ring-offset-0 transition-all duration-200"
                style={{ '--tw-ring-color': `${accentColor}30` } as React.CSSProperties}
              />

              {/* Verify identity — expandable */}
              {showVerify ? (
                <div className="p-3 rounded-lg border border-border/40 dark:border-white/8 bg-muted/20 dark:bg-white/3 space-y-2.5">
                  {verifyStep === 'code' ? (
                    <>
                      <p className="text-[11px] text-muted-foreground text-center">
                        Code sent to <strong className="text-foreground">{verifyEmail}</strong>
                      </p>
                      <Input
                        placeholder="000000"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="h-9 text-center text-lg tracking-[0.25em] font-mono rounded-lg border-border/50 dark:border-white/10"
                        maxLength={6}
                        autoFocus
                      />
                      {otpError && <p className="text-[11px] text-red-500 text-center">{otpError}</p>}
                      <Button
                        type="button"
                        onClick={handleVerifyCode}
                        disabled={otpCode.length !== 6 || otpLoading}
                        style={{ backgroundColor: accentColor }}
                        className="w-full h-8 text-xs text-white rounded-lg font-semibold cursor-pointer disabled:opacity-40"
                      >
                        {otpLoading ? 'Verifying...' : 'Verify'}
                      </Button>
                    </>
                  ) : verifyStep === 'email' ? (
                    <>
                      <Input
                        placeholder="Your email"
                        type="email"
                        value={verifyEmail}
                        onChange={(e) => setVerifyEmail(e.target.value)}
                        className="h-9 text-sm rounded-lg border-border/50 dark:border-white/10"
                        autoFocus
                      />
                      {otpError && <p className="text-[11px] text-red-500 text-center">{otpError}</p>}
                      <Button
                        type="button"
                        onClick={handleVerifyEmailSend}
                        disabled={!verifyEmail || otpLoading}
                        variant="outline"
                        className="w-full h-8 text-xs rounded-lg font-medium cursor-pointer border-border/50 dark:border-white/10"
                      >
                        <Mail className="h-3 w-3 mr-1.5" />
                        {otpLoading ? 'Sending...' : 'Send code'}
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        type="button"
                        onClick={() => setVerifyStep('email')}
                        variant="outline"
                        className="w-full h-8 text-xs rounded-lg font-medium cursor-pointer border-border/50 dark:border-white/10"
                      >
                        <Mail className="h-3 w-3 mr-1.5" />
                        Verify with email
                      </Button>
                      <Button
                        type="button"
                        onClick={handleGoogleVerify}
                        variant="outline"
                        className="w-full h-8 text-xs rounded-lg font-medium cursor-pointer border-border/50 dark:border-white/10"
                      >
                        <svg className="h-3 w-3 mr-1.5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        Continue with Google
                      </Button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => { setShowVerify(false); setVerifyStep('options'); setOtpError('') }}
                    className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground w-full text-center cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowVerify(true)}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer"
                >
                  <Shield className="h-3 w-3" />
                  Verify your identity
                </button>
              )}
            </div>
          )}
          {identifiedUser && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
              <Shield className="h-3 w-3" style={{ color: accentColor }} />
              <span>Commenting as <strong className="text-foreground">{identifiedUser.name || identifiedUser.email}</strong></span>
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={1}
              className="flex-1 resize-none text-sm rounded-lg border-border/50 dark:border-white/10 focus:ring-1 focus:ring-offset-0 transition-all duration-200 min-h-[36px] max-h-[80px]"
              style={{ '--tw-ring-color': `${accentColor}30` } as React.CSSProperties}
            />
            <Button
              type="submit"
              disabled={!canSubmitComment || submitting}
              style={{ backgroundColor: accentColor }}
              className="text-white rounded-lg h-9 w-9 p-0 hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-40 shrink-0"
              size="sm"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </form>
        )}
      </div>
    </div>
  )
}
