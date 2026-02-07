'use client'

import { useState, useEffect } from 'react'
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

// Responsive size function - returns viewport width percentage
function getResponsiveSize(size: WidgetSettings['size']): string {
  switch (size) {
    case 'xsmall':
      return '25vw'
    case 'small':
      return '35vw'
    case 'medium':
      return '45vw'
    case 'large':
      return '55vw'
    case 'xlarge':
      return '70vw'
    default:
      return '55vw'
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


export function AllInOnePopupPreview({ orgId, orgSlug, onClose, settings }: AllInOnePopupPreviewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [posts, setPosts] = useState<Post[]>([])
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch posts
        const postsRes = await fetch(`/api/posts?board_id=&limit=10`)
        if (postsRes.ok) {
          const postsData = await postsRes.json()
          const formattedPosts: Post[] = (postsData.posts || []).map((p: any) => ({
            id: p.id,
            title: p.title,
            content: p.content || '',
            votes: p.vote_count || 0,
            author: p.author_name || p.guest_name || 'Anonymous',
            category: 'Feature Requests',
            status: p.status || 'planned',
            hasVoted: false,
          }))
          setPosts(formattedPosts)
        }

        // Fetch changelog
        const changelogRes = await fetch(`/api/changelog?org_id=${orgId}&published_only=true`)
        if (changelogRes.ok) {
          const changelogData = await changelogRes.json()
          setChangelog(changelogData.entries || [])
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    if (orgId) {
      fetchData()
    }
  }, [orgId])

  const responsiveWidth = getResponsiveSize(settings.size)
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
  
  // Get popup placement from settings
  const popupPlacement = settings.allInOnePopupPlacement || 'right'
  const isLeft = popupPlacement === 'left'
  
  // Apply text style
  const textStyleClass = settings.allInOneTextStyle === 'bold' || settings.allInOneTextStyle === 'bold-italic' 
    ? 'font-bold' 
    : ''
  const textItalicClass = settings.allInOneTextStyle === 'italic' || settings.allInOneTextStyle === 'bold-italic'
    ? 'italic'
    : ''

  // Style variant configurations
  const styleVariant = settings.allInOneStyleVariant || '1'
  const getVariantStyles = () => {
    switch (styleVariant) {
      case '2':
        return {
          headerBgClass: 'bg-gray-50',
          headerBgStyle: undefined,
          cardBorder: 'border-2',
          buttonStyle: 'outline',
        }
      case '3':
        // Convert hex color to rgba with 10% opacity
        const hexToRgba = (hex: string, alpha: number) => {
          const r = parseInt(hex.slice(1, 3), 16)
          const g = parseInt(hex.slice(3, 5), 16)
          const b = parseInt(hex.slice(5, 7), 16)
          return `rgba(${r}, ${g}, ${b}, ${alpha})`
        }
        return {
          headerBgClass: '',
          headerBgStyle: hexToRgba(settings.accentColor, 0.1),
          cardBorder: 'border',
          buttonStyle: 'solid',
        }
      default: // variant 1
        return {
          headerBgClass: '',
          headerBgStyle: 'transparent',
          cardBorder: 'border',
          buttonStyle: 'solid',
        }
    }
  }
  const variantStyles = getVariantStyles()

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Modal - positioned based on settings */}
      <div
        className="fixed top-0 h-full flex flex-col z-50"
        style={{
          width: responsiveWidth,
          minWidth: '300px',
          maxWidth: '90vw',
          ...(isLeft ? { left: '0' } : { right: '0' }),
          borderRadius: isLeft ? `${borderRadius} 0 0 0` : `0 ${borderRadius} 0 0`,
          boxShadow: isLeft ? '4px 0 20px rgba(0,0,0,0.1)' : '-4px 0 20px rgba(0,0,0,0.1)',
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
        <div className={`px-6 pt-6 pb-4 ${variantStyles.headerBgClass}`} style={{ 
          backgroundColor: variantStyles.headerBgStyle,
          borderRadius: borderRadius
        }}>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
            style={{ backgroundColor: `${settings.accentColor}15` }}
          >
            <Zap className="h-5 w-5" style={{ color: settings.accentColor }} />
          </div>
          <h2 className={`text-xl font-semibold text-gray-900 ${textStyleClass} ${textItalicClass}`}>
            {settings.heading || 'Have something to say?'}
          </h2>
          <p className={`text-sm text-gray-500 mt-1 ${textStyleClass} ${textItalicClass}`}>
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
              <Button 
                style={variantStyles.buttonStyle === 'solid' ? { backgroundColor: settings.accentColor } : {}}
                className={`shrink-0 ${variantStyles.buttonStyle === 'outline' ? 'border-2' : 'text-white'}`}
              >
                Create New Post
              </Button>
            </div>

            {/* Posts List */}
            <div className="flex-1 overflow-y-auto px-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-sm">
                    {searchQuery ? 'No posts match your search.' : 'No posts yet.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pb-4">
                  {filteredPosts.map((post) => {
                  const statusStyle = getStatusStyle(post.status)
                  return (
                    <div
                      key={post.id}
                      className={`p-4 ${variantStyles.cardBorder} border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer`}
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
              )}
            </div>
          </TabsContent>

          {/* Changelog Tab */}
          <TabsContent value="changelog" className="flex-1 overflow-y-auto mt-0 pt-4 px-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : changelog.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-sm">No changelog entries yet.</p>
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                {changelog.map((entry) => {
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
            )}
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
