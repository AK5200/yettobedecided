'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AllInOneWidget } from '@/components/widgets/all-in-one-widget'
import { FeedbackWidget } from '@/components/widgets/feedback-widget'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { X } from 'lucide-react'

function AllInOneContent() {
  const searchParams = useSearchParams()
  const org = searchParams.get('org')
  const mode = searchParams.get('mode') || 'popup'
  const [boards, setBoards] = useState<{ id: string; name: string }[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [changelog, setChangelog] = useState<any[]>([])
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)

  useEffect(() => {
    if (!org) return

    const fetchData = async () => {
      try {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        const res = await fetch(`${baseUrl}/api/widget?org=${encodeURIComponent(org)}`)
        if (res.ok) {
          const data = await res.json()
          setBoards(data.boards || [])
          setChangelog(data.changelog || [])
          setSettings(data.settings || {})
          
          // Fetch posts for the first board
          if (data.boards && data.boards.length > 0) {
            const postsRes = await fetch(`${baseUrl}/api/posts?board_id=${data.boards[0].id}&limit=20`)
            if (postsRes.ok) {
              const postsData = await postsRes.json()
              setPosts(postsData.posts || [])
            }
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

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-white" style={{ pointerEvents: 'auto' }}>
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
  const showBranding = settings?.show_branding !== false
  const heading = settings?.heading || 'Have something to say?'
  const subheading = settings?.subheading || 'Suggest a feature, read through our feedback and check out our latest feature releases.'

  const handleCreatePost = () => {
    setShowFeedbackForm(true)
  }

  const handleCloseFeedback = () => {
    setShowFeedbackForm(false)
  }

  const handleFeedbackSubmit = async () => {
    // Refresh posts after submission
    if (boards.length > 0) {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const postsRes = await fetch(`${baseUrl}/api/posts?board_id=${boards[0].id}&limit=20`)
      if (postsRes.ok) {
        const postsData = await postsRes.json()
        setPosts(postsData.posts || [])
      }
    }
    setShowFeedbackForm(false)
  }

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage('feedbackhub:close', '*')
    }
  }

  return (
    <div className="w-full min-h-screen bg-white relative" style={{ pointerEvents: 'auto' }}>
      {/* Close button */}
      <button
        onClick={handleClose}
        className="fixed top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-50 bg-white shadow-sm"
        aria-label="Close"
      >
        <X className="h-5 w-5 text-gray-500" />
      </button>

      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <AllInOneWidget
            boards={boards}
            posts={posts}
            changelog={changelog}
            orgSlug={org || ''}
            accentColor={accentColor}
            backgroundColor={backgroundColor}
            showBranding={showBranding}
            heading={heading}
            subheading={subheading}
            onCreatePost={handleCreatePost}
          />
        </div>
      </div>

      {/* Feedback Form Modal */}
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

export default function AllInOneEmbedPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <AllInOneContent />
    </Suspense>
  )
}
