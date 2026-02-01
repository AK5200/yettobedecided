'use client'

import { useState } from 'react'
import { X, Search, ChevronUp, Zap } from 'lucide-react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { WidgetSettings } from '@/app/(dashboard)/widgets/page'

interface ChangelogEntry {
  id: string
  title: string
  content: string
  category: string
  published_at: string | null
  is_published: boolean
}

interface Post {
  id: string
  title: string
  content: string
  votes: number
  author: string
  category: string
  status: 'planned' | 'in_progress' | 'completed' | 'under_review'
  hasVoted?: boolean
}

interface AllInOnePopupPreviewProps {
  orgId: string
  orgSlug: string
  onClose: () => void
  settings: WidgetSettings
}

function getSizeStyle(size: WidgetSettings['size']): string {
  switch (size) {
    case 'small':
      return '480px'
    case 'medium':
      return '560px'
    case 'large':
      return '680px'
    case 'xlarge':
      return '780px'
    default:
      return '680px'
  }
}

function getBorderRadiusStyle(radius: WidgetSettings['borderRadius']): string {
  switch (radius) {
    case 'none':
      return '0px'
    case 'small':
      return '8px'
    case 'medium':
      return '12px'
    case 'large':
      return '16px'
    default:
      return '12px'
  }
}

function getShadowStyle(shadow: WidgetSettings['shadow']): string {
  switch (shadow) {
    case 'none':
      return 'none'
    case 'small':
      return '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    case 'medium':
      return '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    case 'large':
      return '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
    default:
      return '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
  }
}

function getStatusStyle(status: Post['status']): { bg: string; text: string } {
  switch (status) {
    case 'planned':
      return { bg: 'bg-blue-100', text: 'text-blue-700' }
    case 'in_progress':
      return { bg: 'bg-yellow-100', text: 'text-yellow-700' }
    case 'completed':
      return { bg: 'bg-green-100', text: 'text-green-700' }
    case 'under_review':
      return { bg: 'bg-purple-100', text: 'text-purple-700' }
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700' }
  }
}

function getStatusLabel(status: Post['status']): string {
  switch (status) {
    case 'planned':
      return 'Planned'
    case 'in_progress':
      return 'In Progress'
    case 'completed':
      return 'Completed'
    case 'under_review':
      return 'Under Review'
    default:
      return status
  }
}

function getCategoryStyle(category: string): { bg: string; text: string } {
  switch (category) {
    case 'feature':
      return { bg: 'bg-green-100', text: 'text-green-700' }
    case 'improvement':
      return { bg: 'bg-blue-100', text: 'text-blue-700' }
    case 'fix':
      return { bg: 'bg-orange-100', text: 'text-orange-700' }
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700' }
  }
}

const mockPosts: Post[] = [
  {
    id: '1',
    title: 'Localize changelog email subject and CTA text',
    content: 'Allow users to customize the language of changelog email subject lines and call-to-action buttons to match their preferred language.',
    votes: 1,
    author: 'Medevio',
    category: 'Feature Requests',
    status: 'under_review',
  },
  {
    id: '2',
    title: 'Quarters',
    content: "Ability to customise the Quarter. Some companies don't have their quarter aligned with the year quarters.",
    votes: 1,
    author: 'Ricardo',
    category: 'Feature Requests',
    status: 'planned',
  },
  {
    id: '3',
    title: "What's new widget - status badge",
    content: 'Implement server-side tracking for notification badge "read" status instead of relying on browser cache, ensuring consistent badge...',
    votes: 3,
    author: 'Alex',
    category: 'Feature Requests',
    status: 'in_progress',
  },
  {
    id: '4',
    title: 'Dark mode for public pages',
    content: 'Add dark mode support for all public-facing pages including changelog, roadmap, and feedback boards.',
    votes: 5,
    author: 'Sarah',
    category: 'Feature Requests',
    status: 'completed',
  },
]

const mockChangelog: ChangelogEntry[] = [
  {
    id: '1',
    title: 'User Segmentation',
    content: 'Enable moderation today in your dashboard settings to build a better community experience.',
    category: 'feature',
    published_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    is_published: true,
  },
  {
    id: '2',
    title: 'Dark Mode Support',
    content: "We've added a beautiful dark mode to reduce eye strain during late-night work sessions.",
    category: 'feature',
    published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    is_published: true,
  },
  {
    id: '3',
    title: 'Performance Improvements',
    content: 'Pages now load 40% faster with improved caching and optimized database queries.',
    category: 'improvement',
    published_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    is_published: true,
  },
]

export function AllInOnePopupPreview({ orgId, orgSlug, onClose, settings }: AllInOnePopupPreviewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [posts, setPosts] = useState(mockPosts)

  const maxWidth = getSizeStyle(settings.size)
  const borderRadius = getBorderRadiusStyle(settings.borderRadius)
  const boxShadow = getShadowStyle(settings.shadow)

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleVote = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              votes: post.hasVoted ? post.votes - 1 : post.votes + 1,
              hasVoted: !post.hasVoted,
            }
          : post
      )
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full mx-4 max-h-[85vh] flex flex-col"
        style={{
          maxWidth,
          borderRadius,
          boxShadow,
          backgroundColor: settings.backgroundColor,
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
            style={{ backgroundColor: `${settings.accentColor}15` }}
          >
            <Zap className="h-5 w-5" style={{ color: settings.accentColor }} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            {settings.heading || 'Have something to say?'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {settings.subheading || 'Suggest a feature, read through our feedback and check out our latest feature releases.'}
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="board" className="flex-1 flex flex-col min-h-0">
          <div className="px-6">
            <TabsList className="w-auto gap-4 bg-transparent p-0 h-auto">
              <TabsTrigger
                value="board"
                className="px-0 pb-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-current"
                style={{ '--tw-border-opacity': 1 } as any}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                  Board
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="changelog"
                className="px-0 pb-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-current"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16v16H4z" />
                    <path d="M4 9h16" />
                    <path d="M9 4v16" />
                  </svg>
                  Changelog
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Board Tab */}
          <TabsContent value="board" className="flex-1 flex flex-col min-h-0 mt-0 pt-4">
            {/* Search and Create */}
            <div className="px-6 pb-4 flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button style={{ backgroundColor: settings.accentColor }} className="text-white shrink-0">
                Create New Post
              </Button>
            </div>

            {/* Posts List */}
            <div className="flex-1 overflow-y-auto px-6">
              <div className="space-y-3 pb-4">
                {filteredPosts.map((post) => {
                  const statusStyle = getStatusStyle(post.status)
                  return (
                    <div
                      key={post.id}
                      className="p-4 border rounded-lg hover:border-gray-300 transition-colors cursor-pointer"
                    >
                      <div className="flex gap-4">
                        {/* Vote button */}
                        <button
                          onClick={() => handleVote(post.id)}
                          className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg border transition-colors shrink-0 ${
                            post.hasVoted
                              ? 'border-transparent text-white'
                              : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}
                          style={
                            post.hasVoted
                              ? { backgroundColor: settings.accentColor }
                              : {}
                          }
                        >
                          <ChevronUp className="h-4 w-4" />
                          <span className="text-sm font-medium">{post.votes}</span>
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm">{post.title}</h4>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{post.content}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1.5">
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium text-white"
                                style={{ backgroundColor: settings.accentColor }}
                              >
                                {post.author.charAt(0)}
                              </div>
                              <span className="text-xs text-gray-500">{post.author}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {post.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </TabsContent>

          {/* Changelog Tab */}
          <TabsContent value="changelog" className="flex-1 overflow-y-auto mt-0 pt-4 px-6">
            <div className="space-y-4 pb-4">
              {mockChangelog.map((entry) => {
                const categoryStyle = getCategoryStyle(entry.category)
                return (
                  <div key={entry.id} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <Badge className={`${categoryStyle.bg} ${categoryStyle.text} border-0`}>
                        {entry.category}
                      </Badge>
                      <span>
                        {entry.published_at
                          ? new Date(entry.published_at).toLocaleDateString()
                          : 'Recently'}
                      </span>
                    </div>
                    <div className="font-medium text-gray-900">{entry.title}</div>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">{entry.content}</p>
                  </div>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div
          className="px-6 py-3 border-t flex items-center justify-between"
          style={{
            borderBottomLeftRadius: borderRadius,
            borderBottomRightRadius: borderRadius,
          }}
        >
          {settings.showBranding ? (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Zap className="h-3 w-3" style={{ color: settings.accentColor }} />
              Powered by FeedbackHub
            </span>
          ) : (
            <span />
          )}
          <Link
            href={`/${orgSlug}/features`}
            className="text-xs font-medium hover:underline"
            style={{ color: settings.accentColor }}
            onClick={onClose}
          >
            View all posts
          </Link>
        </div>
      </div>
    </div>
  )
}
