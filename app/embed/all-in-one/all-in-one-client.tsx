'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { AllInOneWidget } from '@/components/widgets/all-in-one-widget'
import { FeedbackWidget } from '@/components/widgets/feedback-widget'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { X } from 'lucide-react'

export default function AllInOneEmbedClient() {
  const searchParams = useSearchParams()
  const org = searchParams.get('org')
  const [boards, setBoards] = useState<{ id: string; name: string }[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [changelog, setChangelog] = useState<any[]>([])
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [identifiedUser, setIdentifiedUser] = useState<any>(null)

  // Read identified user from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('feedbackhub_identified_user')
      if (stored) {
        setIdentifiedUser(JSON.parse(stored))
      }
    } catch {
      // Ignore storage errors
    }
  }, [])

  // Listen for identity from parent via postMessage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'feedbackhub:identity') {
        const user = event.data.user
        if (user) {
          setIdentifiedUser(user)
          try {
            sessionStorage.setItem('feedbackhub_identified_user', JSON.stringify(user))
          } catch {
            // Ignore storage errors
          }
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  useEffect(() => {
    if (!org) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        const res = await fetch(`${baseUrl}/api/widget?org=${encodeURIComponent(org)}`)
        if (res.ok) {
          const data = await res.json()
          setBoards(data.boards || [])
          setChangelog(data.changelog || [])
          setSettings(data.settings || {})

          if (data.posts && Array.isArray(data.posts) && data.posts.length > 0) {
            const formattedPosts = data.posts.map((p: any) => ({
              id: p.id,
              title: p.title,
              content: p.content || '',
              votes: p.vote_count || 0,
              author_name: p.author_name || p.guest_name || 'Anonymous',
              author_email: p.author_email || p.guest_email,
              tags: p.tags || [],
              status: p.status || 'open',
              hasVoted: false,
            }))
            setPosts(formattedPosts)
          }
        }
      } catch (error) {
        console.error('Failed to fetch widget data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [org])

  const handleVote = useCallback(async (postId: string) => {
    const email = identifiedUser?.email
    if (!email) return // Optimistic update already happened in widget, but no API call without email

    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      await fetch(`${baseUrl}/api/widget/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, email }),
      })
    } catch (error) {
      console.error('Vote failed:', error)
    }
  }, [identifiedUser])

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center" style={{ pointerEvents: 'auto' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (!org) {
    return <div className="p-4 text-sm">Missing org parameter.</div>
  }

  const accentColor = settings?.accent_color || '#F59E0B'
  const backgroundColor = settings?.background_color || '#ffffff'
  const headerBackgroundColor = settings?.header_background_color || settings?.background_color || '#ffffff'
  const showBranding = settings?.show_branding !== false
  const heading = settings?.heading || 'Have something to say?'
  const subheading = settings?.subheading || 'Suggest a feature, read through our feedback and check out our latest feature releases.'
  const textStyle = settings?.all_in_one_text_style || 'default'
  const styleVariant = String(settings?.all_in_one_style_variant || searchParams.get('style') || '1') as '1' | '2' | '3'
  const borderRadius = settings?.border_radius || 'medium'

  const handleCreatePost = () => {
    setShowFeedbackForm(true)
  }

  const handleFeedbackSubmit = async () => {
    // Re-read identified user from sessionStorage (user may have just authenticated in the feedback form)
    try {
      const stored = sessionStorage.getItem('feedbackhub_identified_user')
      if (stored) {
        setIdentifiedUser(JSON.parse(stored))
      }
    } catch {
      // Ignore storage errors
    }

    // Re-fetch posts from widget API (uses admin client to bypass RLS)
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const res = await fetch(`${baseUrl}/api/widget?org=${encodeURIComponent(org || '')}`)
      if (res.ok) {
        const data = await res.json()
        if (data.posts && Array.isArray(data.posts)) {
          const formattedPosts = data.posts.map((p: any) => ({
            id: p.id,
            title: p.title,
            content: p.content || '',
            votes: p.vote_count || 0,
            author_name: p.author_name || p.guest_name || 'Anonymous',
            author_email: p.author_email || p.guest_email,
            tags: p.tags || [],
            status: p.status || 'open',
            hasVoted: false,
          }))
          setPosts(formattedPosts)
        }
      }
    } catch (error) {
      console.error('Failed to refresh posts:', error)
    }
    setShowFeedbackForm(false)
  }

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage('feedbackhub:close', '*')
    }
  }

  return (
    <div
      className="w-full h-full relative flex flex-col"
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
        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-50 bg-white shadow-sm"
        aria-label="Close"
      >
        <X className="h-5 w-5 text-gray-500" />
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
        />
      </div>

      <Dialog open={showFeedbackForm} onOpenChange={setShowFeedbackForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <FeedbackWidget
            boards={boards}
            orgSlug={org || ''}
            accentColor={accentColor}
            showBranding={showBranding}
            onSubmit={handleFeedbackSubmit}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
