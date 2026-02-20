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
  
  // Get border radius class for buttons and cards
  const getBorderRadiusClass = (radius: WidgetSettings['borderRadius']): string => {
    switch (radius) {
      case 'none': return 'rounded-none'
      case 'small': return 'rounded-sm'
      case 'medium': return 'rounded-md'
      case 'large': return 'rounded-lg'
      case 'xlarge': return 'rounded-xl'
      default: return 'rounded-md'
    }
  }
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
        // Glass morphism - Top Nav style (white background)
        return {
          containerClass: '',
          containerStyle: { 
            background: '#ffffff',
            border: 'none',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
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
          borderRadius: '40px',
          voteButtonClass: 'bg-white border border-gray-200',
        }
      case '3':
        // Clean Supahub-style (horizontal tabs, vote on right, divider lines)
        return {
          containerClass: '',
          containerStyle: {
            background: '#ffffff',
            border: 'none',
            boxShadow: '0 32px 64px -16px rgba(0, 0, 0, 0.1)'
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

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Modal - positioned based on settings */}
      <div
        className={`fixed top-0 h-full flex flex-col z-50 ${variantStyles.containerClass}`}
        style={{
          width: responsiveWidth,
          minWidth: '300px',
          maxWidth: '90vw',
          ...(isLeft ? { left: '0' } : { right: '0' }),
          // Border radius only on the non-edge side (right if left-aligned, left if right-aligned)
          borderRadius: isLeft 
            ? `0 ${borderRadius} ${borderRadius} 0` 
            : `${borderRadius} 0 0 ${borderRadius}`,
          boxShadow: boxShadow || (isLeft ? '4px 0 20px rgba(0,0,0,0.1)' : '-4px 0 20px rgba(0,0,0,0.1)'),
          backgroundColor: variantStyles.containerStyle?.background || '#ffffff',
          border: variantStyles.containerStyle?.border,
          ...variantStyles.containerStyle,
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        {/* Content Layout */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header */}
              <div className={`px-6 pt-6 pb-4 ${variantStyles.headerBgClass}`} style={{
                backgroundColor: settings.headerBackgroundColor || variantStyles.headerBgStyle || 'transparent',
                borderRadius: borderRadius
              }}>
                <div
                  className={`w-10 h-10 ${styleVariant === '2' ? 'rounded-2xl shadow-lg' : 'rounded-xl'} flex items-center justify-center mb-4`}
                  style={{
                    backgroundColor: styleVariant === '2'
                      ? settings.accentColor
                      : hexToRgba(settings.accentColor, 0.15),
                    boxShadow: styleVariant === '2' ? `0 0 20px ${hexToRgba(settings.accentColor, 0.2)}` : undefined
                  }}
                >
                  <Zap className="h-5 w-5" style={{ color: styleVariant === '2' ? 'white' : settings.accentColor }} />
                </div>
                <h2 className={`${styleVariant === '2' ? 'text-3xl font-extrabold' : 'text-xl font-semibold'} text-gray-900 ${textStyleClass} ${textItalicClass}`}>
                  {settings.heading || 'Have something to say?'}
                </h2>
                <p className={`text-sm ${styleVariant === '2' ? 'font-medium' : ''} text-gray-500 mt-1 ${textStyleClass} ${textItalicClass}`}>
                  {settings.subheading || 'Suggest a feature, read through our feedback and check out our latest feature releases.'}
                </p>
              </div>

            {/* Tabs */}
        <Tabs defaultValue="board" className="flex-1 flex flex-col min-h-0">
            <div className={`px-6 ${styleVariant === '2' ? 'border-b border-white/10' : ''}`}>
              <TabsList className={`w-auto gap-4 ${styleVariant === '2' ? 'gap-8' : 'gap-4'} bg-transparent p-0 h-auto`}>
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
          <TabsContent value="board" className="flex-1 flex flex-col min-h-0 mt-0 pt-4">
            {/* Search and Create */}
            <div className={`px-6 ${styleVariant === '2' ? 'py-6' : 'pb-4'} flex gap-3 items-center`}>
              <div className="relative flex-1">
                <Search className={`absolute ${styleVariant === '2' ? 'left-4' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400`} />
                <Input
                  placeholder={styleVariant === '2' ? "Explore ideas..." : "Search posts..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${styleVariant === '2' ? 'pl-12 pr-4 py-4 bg-white/30 border border-white/20 rounded-2xl focus:ring-2 focus:ring-primary/40' : 'pl-9'}`}
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
                style={variantStyles.buttonStyle === 'solid' 
                  ? { 
                      backgroundColor: settings.accentColor, 
                      color: 'white',
                      boxShadow: styleVariant === '2' ? `0 0 20px ${hexToRgba(settings.accentColor, 0.2)}` : undefined
                    }
                  : { borderColor: settings.accentColor, color: settings.accentColor, backgroundColor: 'transparent' }
                }
                variant={variantStyles.buttonStyle === 'outline' ? 'outline' : 'default'}
                className={`shrink-0 ${styleVariant === '2' ? 'px-8 py-4 font-bold shadow-xl' : variantStyles.buttonStyle === 'outline' ? 'border-2' : ''} ${borderRadiusClass}`}
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
            <div className={`flex-1 overflow-y-auto px-6`}>
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
                <div className={`${styleVariant === '3' ? 'divide-y divide-gray-200' : styleVariant === '2' ? 'space-y-4' : 'space-y-3'} pb-4`}>
                  {filteredPosts.map((post) => {
                  const statusStyle = getStatusStyle(post.status)

                  if (styleVariant === '3') {
                    // Supahub-style: content left, vote right, divider lines
                    return (
                      <div
                        key={post.id}
                        className="py-4 first:pt-2 last:pb-2 hover:bg-gray-50 transition-colors cursor-pointer px-1 group"
                      >
                        <div className="flex items-start gap-4">
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm">{post.title}</h3>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{post.content}</p>
                            <div className="flex items-center gap-2 mt-2.5">
                              <div className="flex items-center gap-1.5">
                                <div
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium text-white"
                                  style={{ backgroundColor: settings.accentColor }}
                                >
                                  {post.author.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-xs text-gray-500">{post.author}</span>
                              </div>
                              <Badge className="bg-red-50 text-red-600 border-0 text-[10px] font-medium px-2 py-0.5 rounded">
                                {post.category}
                              </Badge>
                            </div>
                          </div>

                          {/* Vote button - right side */}
                          <button
                            onClick={() => handleVote(post.id)}
                            className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg border transition-colors shrink-0 ${
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
                            <ChevronUp className="h-4 w-4" />
                            <span className="text-sm font-semibold">{post.votes}</span>
                          </button>
                        </div>
                      </div>
                    )
                  }

                  // Default style 1 & 2
                  return (
                    <div
                      key={post.id}
                      className={`${styleVariant === '2' ? 'p-6' : 'p-4'} ${variantStyles.cardClass} ${variantStyles.cardBorder} ${borderRadiusClass} hover:border-gray-300 transition-all cursor-pointer group ${
                        styleVariant === '2'
                          ? 'hover:translate-y-[-2px] hover:shadow-md'
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
                      <div className={`flex ${styleVariant === '2' ? 'gap-6' : 'gap-4'}`}>
                        {/* Vote button */}
                        <button
                          onClick={() => handleVote(post.id)}
                        className={`flex flex-col items-center justify-center ${styleVariant === '2' ? 'px-3 py-3 min-w-[64px]' : 'px-3 py-2'} ${borderRadiusClass} border transition-colors shrink-0 ${
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
                          <ChevronUp className={`h-4 w-4 ${styleVariant === '2' ? 'group-hover:text-primary' : ''}`} style={post.hasVoted ? {} : (styleVariant === '2' ? { color: '#6b7280' } : {})} />
                          <span className={`${styleVariant === '2' ? 'text-lg font-extrabold' : 'text-sm font-medium'} ${post.hasVoted ? 'text-white' : styleVariant === '2' ? 'text-gray-900' : 'text-gray-600'}`}>
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
                                className={`${statusStyle.bg} ${statusStyle.text} border-0 ${styleVariant === '2' ? 'text-[10px] font-bold uppercase tracking-widest rounded-full border' : 'text-xs'}`}
                                style={styleVariant === '2' ? {
                                  borderColor: statusStyle.bg.includes('blue') ? 'rgba(59, 130, 246, 0.2)' : statusStyle.bg.includes('green') ? hexToRgba(settings.accentColor, 0.2) : 'rgba(107, 114, 128, 0.2)'
                                } : {}}
                              >
                                {getStatusLabel(post.status)}
                              </Badge>
                            )}
                          </div>
                          <p className={`${styleVariant === '2' ? 'text-sm mb-4 leading-relaxed font-medium line-clamp-3' : 'text-xs mt-1 line-clamp-2'} text-gray-500`}>
                            {post.content}
                          </p>
                          <div className={`flex items-center ${styleVariant === '2' ? 'gap-4' : 'gap-2'} ${styleVariant === '2' ? 'mt-0' : 'mt-2'}`}>
                            <div className="flex items-center gap-2">
                              <div
                                className={`${styleVariant === '2' ? 'w-6 h-6 rounded-full bg-gradient-to-tr border border-white/20' : 'w-5 h-5 rounded-full'} flex items-center justify-center text-xs font-medium text-white`}
                                style={{ backgroundColor: settings.accentColor }}
                              >
                                {post.author.charAt(0).toUpperCase()}
                              </div>
                              <span className={`text-xs ${styleVariant === '2' ? 'font-bold text-gray-700' : 'text-gray-500'}`}>
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
              Powered by Kelo
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
      </div>
    </div>
  )
}
