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

interface AllInOnePopoverPreviewProps {
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
    case 'xlarge':
      return '24px'
    default:
      return '12px'
  }
}

function getBorderRadiusClass(radius: WidgetSettings['borderRadius']): string {
  switch (radius) {
    case 'none': return 'rounded-none'
    case 'small': return 'rounded-sm'
    case 'medium': return 'rounded-md'
    case 'large': return 'rounded-lg'
    case 'xlarge': return 'rounded-xl'
    default: return 'rounded-md'
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

export function AllInOnePopoverPreview({ orgId, orgSlug, onClose, settings }: AllInOnePopoverPreviewProps) {
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
  const borderRadiusClass = getBorderRadiusClass(settings.borderRadius)

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

  // Get popover placement from settings
  const popoverPlacement = settings.allInOnePopoverPlacement || 'bottom-right'
  const isBottom = popoverPlacement.includes('bottom')
  const isLeft = popoverPlacement.includes('left')
  const isRight = popoverPlacement.includes('right')
  
  // Apply text style
  const textStyleClass = settings.allInOneTextStyle === 'bold' || settings.allInOneTextStyle === 'bold-italic' 
    ? 'font-bold' 
    : ''
  const textItalicClass = settings.allInOneTextStyle === 'italic' || settings.allInOneTextStyle === 'bold-italic'
    ? 'italic'
    : ''

  // Helper function to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  // Style variant configurations
  const styleVariant = settings.allInOneStyleVariant || '1'
  const getVariantStyles = () => {
    switch (styleVariant) {
      case '2':
        // Top Nav style (white background)
        return {
          containerClass: '',
          containerStyle: { 
            background: '#ffffff',
            border: 'none',
          },
          headerBgClass: '',
          headerBgStyle: 'transparent',
          cardClass: '',
          cardStyle: {
            background: '#ffffff',
            border: '1px solid rgba(0, 0, 0, 0.08)',
          },
          cardBorder: 'border',
          buttonStyle: 'solid',
          borderRadius: borderRadius,
          voteButtonClass: 'bg-white border border-gray-200',
        }
      case '3':
        // Clean Supahub-style (horizontal tabs, vote on right, divider lines)
        return {
          containerClass: '',
          containerStyle: {
            background: '#ffffff',
            border: 'none',
          },
          headerBgClass: '',
          headerBgStyle: 'transparent',
          cardClass: '',
          cardStyle: {
            background: 'transparent',
            border: 'none',
          },
          cardBorder: 'border-b',
          buttonStyle: 'solid',
          borderRadius: borderRadius,
          voteButtonClass: 'bg-white border border-gray-200',
          hasSidebar: false,
        }
      default: // variant 1 - Standard
        return {
          containerClass: '',
          containerStyle: {},
          headerBgClass: '',
          headerBgStyle: 'transparent',
          cardClass: '',
          cardStyle: {},
          cardBorder: 'border',
          buttonStyle: 'solid',
          borderRadius: borderRadius,
          voteButtonClass: '',
          hasSidebar: false,
        }
    }
  }
  const variantStyles = getVariantStyles()

  // Build position styles - only set one of top/bottom and one of left/right
  // Popover: border radius from all 4 sides
  const positionStyles: React.CSSProperties = {
    width: responsiveWidth,
    minWidth: '300px',
    maxWidth: '90vw',
    borderRadius: borderRadius, // All 4 sides for popover
    boxShadow: boxShadow !== 'none' ? boxShadow : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    backgroundColor: variantStyles.containerStyle?.background || '#ffffff',
    border: variantStyles.containerStyle?.border,
    ...variantStyles.containerStyle,
  }

  // Set vertical position (only one of top or bottom) with responsive spacing
  if (isBottom) {
    positionStyles.bottom = 'clamp(20px, 5vh, 80px)' // Responsive spacing from bottom
  } else {
    positionStyles.top = 'clamp(20px, 5vh, 80px)' // Responsive spacing from top
  }

  // Set horizontal position (only one of left or right)
  if (isLeft) {
    positionStyles.left = 'clamp(16px, 2vw, 24px)' // Responsive spacing from left
  } else {
    positionStyles.right = 'clamp(16px, 2vw, 24px)' // Responsive spacing from right
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Popover Panel - positioned based on settings */}
      <div
        className={`fixed border max-h-[calc(100vh-120px)] flex flex-col ${variantStyles.containerClass}`}
        style={positionStyles}
      >
         {/* Content Layout */}
         <div className="flex-1 min-h-0 flex flex-col">
           <div className="flex-1 flex flex-col min-h-0">
             {/* Header */}
               <div className={`p-4 border-b ${variantStyles.headerBgClass}`} style={{
                 backgroundColor: settings.headerBackgroundColor || variantStyles.headerBgStyle || 'transparent'
               }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`${styleVariant === '2' ? 'w-12 h-12 rounded-2xl shadow-lg' : 'w-9 h-9 rounded-lg'} flex items-center justify-center shrink-0`}
                      style={{
                        backgroundColor: styleVariant === '2'
                          ? settings.accentColor
                          : hexToRgba(settings.accentColor, 0.15),
                        boxShadow: styleVariant === '2' ? `0 0 20px ${hexToRgba(settings.accentColor, 0.2)}` : undefined
                      }}
                    >
                      <Zap className={`${styleVariant === '2' ? 'h-6 w-6' : 'h-4 w-4'}`} style={{ color: styleVariant === '2' ? 'white' : settings.accentColor }} />
                    </div>
                    <div>
                      <h3 className={`${styleVariant === '2' ? 'text-2xl font-extrabold' : 'font-semibold text-sm'} text-gray-900 ${textStyleClass} ${textItalicClass}`}>
                        {settings.heading || 'Have something to say?'}
                      </h3>
                      <p className={`text-xs ${styleVariant === '2' ? 'font-medium' : ''} text-gray-500 mt-0.5 line-clamp-2 ${textStyleClass} ${textItalicClass}`}>
                        {settings.subheading || 'Suggest a feature, read through our feedback and check out our latest feature releases.'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-100 rounded transition-colors shrink-0"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </div>

            {/* Tabs */}
        <Tabs defaultValue="board" className="flex-1 flex flex-col min-h-0">
          <div className={`px-4 pt-3 border-b ${styleVariant === '2' ? 'border-white/10' : ''}`}>
            <TabsList className={`w-auto ${styleVariant === '2' ? 'gap-8' : 'gap-4'} bg-transparent p-0 h-auto`}>
              <TabsTrigger
                value="board"
                className="px-2 py-4 text-sm font-medium text-slate-500 hover:text-primary transition-all data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-b-current"
                style={{
                  '--tw-border-opacity': 1,
                  ...(styleVariant === '2' && {
                    color: settings.accentColor
                  })
                } as any}
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
                className="px-2 py-4 text-sm font-medium text-slate-500 hover:text-primary transition-all data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-b-current"
                style={{
                  '--tw-border-opacity': 1,
                  ...(styleVariant === '2' && {
                    color: settings.accentColor
                  })
                } as any}
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
          <TabsContent value="board" className="flex-1 overflow-y-auto mt-0 pt-4 px-3">
            {/* Search and Create */}
            <div className={`p-3 ${styleVariant === '2' ? 'py-6' : 'p-3'} flex gap-2 items-center`}>
              <div className="relative flex-1">
                <Search className={`absolute ${styleVariant === '2' ? 'left-4' : 'left-2.5'} top-1/2 -translate-y-1/2 ${styleVariant === '2' ? 'h-4 w-4' : 'h-3.5 w-3.5'} text-gray-400`} />
                <Input
                  placeholder={styleVariant === '2' ? "Explore ideas..." : "Search posts..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${styleVariant === '2' ? 'pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/40' : 'pl-8 h-9 text-sm'}`}
                />
              </div>
              {styleVariant === '2' && (
                <button className="px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-600 hover:bg-gray-100 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M7 12h10M5 18h14" />
                  </svg>
                </button>
              )}
              <Button
                size="sm"
                style={variantStyles.buttonStyle === 'solid' 
                  ? { 
                      backgroundColor: settings.accentColor, 
                      color: 'white',
                      boxShadow: styleVariant === '2' ? `0 0 20px ${hexToRgba(settings.accentColor, 0.2)}` : undefined
                    }
                  : { borderColor: settings.accentColor, color: settings.accentColor, backgroundColor: 'transparent' }
                }
                variant={variantStyles.buttonStyle === 'outline' ? 'outline' : 'default'}
                className={`shrink-0 ${styleVariant === '2' ? 'px-8 py-4 font-bold shadow-xl h-auto' : 'h-9'} ${variantStyles.buttonStyle === 'outline' ? 'border-2' : ''} ${borderRadiusClass}`}
              >
                {styleVariant === '2' ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 4v16m8-8H4" />
                    </svg>
                    New Post
                  </span>
                ) : (
                  'Create New Post'
                )}
              </Button>
            </div>

            {/* Posts List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-12 px-3">
                  <p className="text-gray-500 text-sm">
                    {searchQuery ? 'No posts match your search.' : 'No posts yet.'}
                  </p>
                </div>
              ) : (
                <div className={`${styleVariant === '3' ? 'px-3 pb-3 divide-y divide-gray-200' : styleVariant === '2' ? 'px-6 pb-4 space-y-4' : 'px-3 pb-3 space-y-2'}`}>
                  {filteredPosts.map((post) => {
                  const statusStyle = post.status ? getStatusStyle(post.status) : null

                  if (styleVariant === '3') {
                    // Supahub-style: content left, vote right, divider lines
                    return (
                      <div
                        key={post.id}
                        className="py-3 first:pt-1 last:pb-1 hover:bg-gray-50 transition-colors cursor-pointer px-1 group"
                      >
                        <div className="flex items-start gap-3">
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm">{post.title}</h3>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{post.content}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex items-center gap-1.5">
                                <div
                                  className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-medium text-white"
                                  style={{ backgroundColor: settings.accentColor }}
                                >
                                  {post.author.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-[10px] text-gray-500">{post.author}</span>
                              </div>
                              <Badge className="bg-red-50 text-red-600 border-0 text-[10px] font-medium px-1.5 py-0 rounded">
                                {post.category}
                              </Badge>
                            </div>
                          </div>

                          {/* Vote button - right side */}
                          <button
                            onClick={() => handleVote(post.id)}
                            className={`flex flex-col items-center justify-center px-2 py-1.5 rounded-lg border transition-colors shrink-0 ${
                              post.hasVoted
                                ? 'border-transparent text-white'
                                : 'border-gray-200 hover:border-gray-300 text-gray-500'
                            }`}
                            style={
                              post.hasVoted
                                ? { backgroundColor: settings.accentColor }
                                : {}
                            }
                          >
                            <ChevronUp className="h-3 w-3" />
                            <span className="text-xs font-semibold">{post.votes}</span>
                          </button>
                        </div>
                      </div>
                    )
                  }

                  // Default style 1 & 2
                  return (
                  <div
                    key={post.id}
                    className={`${styleVariant === '2' ? 'p-6' : 'p-3'} ${variantStyles.cardClass} ${variantStyles.cardBorder} ${styleVariant === '2' ? 'rounded-[32px]' : 'rounded-lg'} hover:border-gray-300 transition-all cursor-pointer group ${
                      styleVariant === '2'
                        ? 'hover:translate-y-[-2px] hover:translate-x-1 hover:shadow-md'
                        : ''
                    }`}
                    style={{
                      ...variantStyles.cardStyle,
                      ...(styleVariant === '2' && post.hasVoted && {
                        borderColor: hexToRgba(settings.accentColor, 0.3),
                        boxShadow: `0 0 20px ${hexToRgba(settings.accentColor, 0.1)}`
                      })
                    }}
                  >
                    <div className={`flex ${styleVariant === '2' ? 'gap-6' : 'gap-3'}`}>
                      {/* Vote button */}
                      <button
                        onClick={() => handleVote(post.id)}
                        className={`flex flex-col items-center justify-center ${styleVariant === '2' ? 'px-3 py-3 min-w-[64px]' : 'px-2 py-1.5'} ${borderRadiusClass} border transition-colors shrink-0 ${
                          post.hasVoted
                            ? 'border-transparent text-white'
                            : variantStyles.voteButtonClass || 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                        style={
                          post.hasVoted
                            ? { backgroundColor: settings.accentColor }
                            : styleVariant === '2'
                              ? {
                                  backgroundColor: '#ffffff',
                                  border: '1px solid rgba(0, 0, 0, 0.1)'
                                }
                              : {}
                        }
                      >
                        <ChevronUp className={`${styleVariant === '2' ? 'h-4 w-4 group-hover:text-primary' : 'h-3 w-3'}`} style={post.hasVoted ? {} : (styleVariant === '2' ? { color: '#6b7280' } : {})} />
                        <span className={`${styleVariant === '2' ? 'text-lg font-extrabold' : 'text-xs font-medium'} ${post.hasVoted ? 'text-white' : styleVariant === '2' ? 'text-gray-900' : 'text-gray-600'}`}>
                          {post.votes}
                        </span>
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className={`${styleVariant === '2' ? 'text-xl font-bold' : 'font-medium text-sm'} text-gray-900 group-hover:text-primary transition-colors line-clamp-1`} style={styleVariant === '2' ? { color: post.hasVoted ? settings.accentColor : undefined } : {}}>
                            {post.title}
                          </h3>
                          {post.status && statusStyle && (
                            <Badge
                              className={`${statusStyle.bg} ${statusStyle.text} border-0 ${styleVariant === '2' ? 'text-[10px] font-bold uppercase tracking-widest rounded-full border' : 'text-[10px] px-1.5 py-0'}`}
                              style={styleVariant === '2' ? {
                                borderColor: statusStyle.bg.includes('blue') ? 'rgba(59, 130, 246, 0.2)' : statusStyle.bg.includes('green') ? hexToRgba(settings.accentColor, 0.2) : 'rgba(107, 114, 128, 0.2)'
                              } : {}}
                            >
                              {getStatusLabel(post.status)}
                            </Badge>
                          )}
                        </div>
                        <p className={`${styleVariant === '2' ? 'text-sm mb-4 leading-relaxed font-medium line-clamp-3' : 'text-xs mt-0.5 line-clamp-1'} text-gray-500`}>
                          {post.content}
                        </p>
                        <div className={`flex items-center ${styleVariant === '2' ? 'gap-4' : 'gap-1.5'} ${styleVariant === '2' ? 'mt-0' : 'mt-1.5'}`}>
                          <div className="flex items-center gap-2">
                            <div
                              className={`${styleVariant === '2' ? 'w-6 h-6 rounded-full bg-gradient-to-tr border border-white/20' : 'w-4 h-4 rounded-full'} flex items-center justify-center text-xs font-medium text-white`}
                              style={{ backgroundColor: settings.accentColor }}
                            >
                              {post.author.charAt(0).toUpperCase()}
                            </div>
                            <span className={`${styleVariant === '2' ? 'text-xs font-bold text-gray-700' : 'text-[10px]'} text-gray-500`}>
                              {post.author}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">• {styleVariant === '2' ? '2 hours ago' : post.category}</span>
                          {styleVariant === '2' && (
                            <div className="flex items-center gap-1 text-gray-400 ml-auto">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                              </svg>
                              <span className="text-xs font-bold">12</span>
                            </div>
                          )}
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
          <TabsContent value="changelog" className="flex-1 overflow-y-auto mt-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : changelog.length === 0 ? (
              <div className="text-center py-12 px-3">
                <p className="text-gray-500 text-sm">No changelog entries yet.</p>
              </div>
            ) : (
              <div className="p-3 space-y-3">
                {changelog.map((entry) => {
                  const categoryStyle = getCategoryStyle(entry.category)
                  return (
                    <div key={entry.id} className="border-b pb-3 last:border-b-0">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
                        <Badge className={`${categoryStyle.bg} ${categoryStyle.text} border-0 text-[10px] px-1.5 py-0`}>
                          {entry.category}
                        </Badge>
                        <span className="text-[10px]">
                          {entry.published_at
                            ? new Date(entry.published_at).toLocaleDateString()
                            : 'Recently'}
                        </span>
                      </div>
                      <div className="font-medium text-gray-900 text-sm">{entry.title}</div>
                      <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">{entry.content}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div
          className="px-3 py-2 border-t flex items-center justify-between"
          style={{
            borderBottomLeftRadius: borderRadius,
            borderBottomRightRadius: borderRadius,
            backgroundColor: settings.backgroundColor,
          }}
        >
          {settings.showBranding ? (
            <span className="text-[10px] text-gray-400 flex items-center gap-1">
              <Zap className="h-2.5 w-2.5" style={{ color: settings.accentColor }} />
              Powered by FeedbackHub
            </span>
          ) : (
            <span />
          )}
          <Link
            href={`/${orgSlug}/features`}
            className="text-[10px] font-medium hover:underline"
            style={{ color: settings.accentColor }}
            onClick={onClose}
          >
            View all
          </Link>
        </div>
          </div>
        </div>
      </div>
    </div>
  )
}
