'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, ChevronUp, MessageSquare } from 'lucide-react'
import { PostDetailView } from './post-detail-view'

interface ChangelogEntry {
  id: string
  title: string
  content: string
  category: string
  published_at?: string | null
}

interface Post {
  id: string
  title: string
  content: string
  votes: number
  author_name?: string
  author_email?: string
  tags?: { name: string }[]
  status?: string
  hasVoted?: boolean
  created_at?: string
}

interface AllInOneWidgetProps {
  boards: { id: string; name: string }[]
  posts?: Post[]
  changelog: ChangelogEntry[]
  orgSlug: string
  accentColor?: string
  backgroundColor?: string
  headerBackgroundColor?: string
  showBranding?: boolean
  heading?: string
  subheading?: string
  textStyle?: 'default' | 'bold' | 'italic' | 'bold-italic'
  styleVariant?: '1' | '2' | '3'
  borderRadius?: 'none' | 'small' | 'medium' | 'large'
  isEmbedded?: boolean
  onCreatePost?: () => void
  onVote?: (postId: string) => void
  identifiedUser?: any
  onPostsChange?: (posts: Post[]) => void
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
      return { bg: 'bg-muted', text: 'text-muted-foreground/80' }
  }
}

function getStatusStyle(status: string): { bg: string; text: string } {
  switch (status?.toLowerCase()) {
    case 'open':
      return { bg: 'bg-muted', text: 'text-muted-foreground' }
    case 'planned':
      return { bg: 'bg-blue-100', text: 'text-blue-700' }
    case 'in_progress':
      return { bg: 'bg-yellow-100', text: 'text-yellow-700' }
    case 'shipped':
      return { bg: 'bg-green-100', text: 'text-green-700' }
    case 'closed':
      return { bg: 'bg-muted', text: 'text-muted-foreground' }
    default:
      return { bg: 'bg-muted', text: 'text-muted-foreground' }
  }
}

function getStatusLabel(status: string): string {
  switch (status?.toLowerCase()) {
    case 'open':
      return 'Open'
    case 'planned':
      return 'Planned'
    case 'in_progress':
      return 'In Progress'
    case 'shipped':
      return 'Shipped'
    case 'closed':
      return 'Closed'
    default:
      return status || 'Open'
  }
}

function formatDate(dateString?: string | null): string {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      timeZone: 'UTC',
    }).format(date)
  } catch {
    return ''
  }
}

function getBorderRadiusClass(borderRadius: string): string {
  switch (borderRadius) {
    case 'none':
      return 'rounded-none'
    case 'small':
      return 'rounded-sm'
    case 'medium':
      return 'rounded-md'
    case 'large':
      return 'rounded-lg'
    case 'xlarge':
      return 'rounded-xl'
    default:
      return 'rounded-md'
  }
}

function getBorderRadiusStyle(radius: string): string {
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

export function AllInOneWidget({
  boards,
  posts: initialPosts = [],
  changelog,
  orgSlug,
  accentColor = '#7c3aed',
  backgroundColor = '#ffffff',
  headerBackgroundColor,
  showBranding = true,
  heading = 'Have something to say?',
  subheading = 'Suggest a feature, read through our feedback and check out our latest feature releases.',
  textStyle = 'default',
  styleVariant: rawStyleVariant = '1',
  borderRadius = 'medium',
  isEmbedded = false,
  onCreatePost,
  onVote,
  identifiedUser,
  onPostsChange,
}: AllInOneWidgetProps) {
  // Defensive: ensure styleVariant is always a string for reliable comparison
  const styleVariant = String(rawStyleVariant) as '1' | '2' | '3'

  // Detect dark mode for inline style overrides
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

  const [searchQuery, setSearchQuery] = useState('')
  const [posts, setPosts] = useState(initialPosts)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [expandedChangelogId, setExpandedChangelogId] = useState<string | null>(null)

  // Sync when parent passes updated posts (e.g. after new post creation)
  useEffect(() => {
    setPosts(initialPosts)
  }, [initialPosts])

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleVote = (postId: string) => {
    setPosts((prev) => {
      const updated = prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              votes: post.hasVoted ? post.votes - 1 : post.votes + 1,
              hasVoted: !post.hasVoted,
            }
          : post
      )
      onPostsChange?.(updated)
      return updated
    })
    // Update selected post if it's the one being voted on
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost({
        ...selectedPost,
        votes: selectedPost.hasVoted ? selectedPost.votes - 1 : selectedPost.votes + 1,
        hasVoted: !selectedPost.hasVoted,
      })
    }
    onVote?.(postId)
  }

  const handlePostClick = async (post: Post) => {
    // Fetch full post details including created_at
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const res = await fetch(`${baseUrl}/api/posts/${post.id}`)
      if (res.ok) {
        const data = await res.json()
        const fullPost: Post = {
          ...post,
          content: data.post?.content || post.content,
          created_at: data.post?.created_at,
          tags: data.post?.tags || post.tags,
        }
        setSelectedPost(fullPost)
      } else {
        // Fallback to existing post data
        setSelectedPost(post)
      }
    } catch (error) {
      console.error('Failed to fetch post details:', error)
      // Fallback to existing post data
      setSelectedPost(post)
    }
  }

  const handleBack = () => {
    setSelectedPost(null)
  }

  const borderRadiusClass = getBorderRadiusClass(borderRadius)
  
  // Helper function to convert hex to rgba (handles 3 and 6 char hex)
  const hexToRgba = (hex: string, alpha: number) => {
    if (!hex || hex[0] !== '#') return `rgba(0, 0, 0, ${alpha})`
    let h = hex.slice(1)
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2]
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(0, 0, 0, ${alpha})`
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  
  // Style variant configurations
  const getVariantStyles = () => {
    switch (styleVariant) {
      case '2':
        // Top Nav style (white background)
        return {
          containerClass: '',
          containerStyle: {
            background: isDark ? '#1a1a1a' : '#ffffff',
            border: 'none',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          },
          headerBg: 'transparent',
          cardClass: '',
          cardStyle: {
            background: isDark ? '#1a1a1a' : '#ffffff',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
          },
          cardBorder: 'border',
          buttonStyle: 'solid',
          borderRadius: '40px',
          voteButtonClass: 'bg-background border border-border',
        }
      case '3':
        // Clean Supahub-style (horizontal tabs, vote on right, divider lines)
        return {
          containerClass: '',
          containerStyle: {
            background: isDark ? '#1a1a1a' : '#ffffff',
            border: 'none',
            boxShadow: '0 32px 64px -16px rgba(0, 0, 0, 0.1)'
          },
          headerBg: 'transparent',
          cardClass: '',
          cardStyle: {
            background: 'transparent',
            border: 'none',
          },
          cardBorder: 'border-b',
          buttonStyle: 'solid',
          borderRadius: borderRadiusClass,
          voteButtonClass: 'bg-background border border-border',
          hasSidebar: false,
        }
      default: // variant 1 - Standard
        return {
          containerClass: '',
          containerStyle: {},
          headerBg: 'transparent',
          cardClass: '',
          cardStyle: {},
          cardBorder: 'border',
          buttonStyle: 'solid',
          borderRadius: borderRadiusClass,
          voteButtonClass: '',
          hasSidebar: false,
        }
    }
  }
  
  const variantStyles = getVariantStyles()

  // Show post detail view if a post is selected
  if (selectedPost) {
    return (
      <div className={`${isEmbedded ? 'h-full flex flex-col' : borderRadiusClass} ${isEmbedded ? '' : 'p-4'} space-y-4`} style={isEmbedded ? {} : { backgroundColor }}>
        <PostDetailView
          post={selectedPost}
          orgSlug={orgSlug}
          accentColor={accentColor}
          onBack={handleBack}
          onVote={handleVote}
          identifiedUser={identifiedUser}
        />
        {showBranding && (
          <div className="pt-2 text-xs text-muted-foreground/60 text-center flex items-center justify-center gap-1">
            <MessageSquare className="h-3 w-3" style={{ color: accentColor }} />
            Powered by Kelo
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={`${isEmbedded ? 'h-full flex flex-col' : (variantStyles.borderRadius || borderRadiusClass)} ${isEmbedded ? '' : 'p-4'} space-y-4 ${variantStyles.containerClass}`}
      data-style-variant={styleVariant}
      style={isEmbedded ? {} : {
        backgroundColor: variantStyles.containerStyle?.background || backgroundColor,
        border: variantStyles.containerStyle?.border,
        boxShadow: variantStyles.containerStyle?.boxShadow,
        ...variantStyles.containerStyle
      }}
    >
      {/* Header */}
      <div className={`px-6 pt-6 pb-4`} style={{
        backgroundColor: headerBackgroundColor || variantStyles.headerBg || 'transparent',
        borderRadius: getBorderRadiusStyle(borderRadius)
      }}>
        <div
          className={`w-10 h-10 ${styleVariant === '2' ? 'rounded-2xl shadow-lg' : borderRadiusClass} flex items-center justify-center mb-4`}
          style={{
            backgroundColor: styleVariant === '2'
              ? accentColor
              : hexToRgba(accentColor, 0.15),
            boxShadow: styleVariant === '2' ? `0 0 20px ${hexToRgba(accentColor, 0.2)}` : undefined
          }}
        >
          <MessageSquare className="h-5 w-5" style={{ color: styleVariant === '2' ? 'white' : accentColor }} />
        </div>
        <h2 className={`${styleVariant === '2' ? 'text-3xl font-extrabold' : 'text-lg font-semibold'} text-foreground ${
          textStyle === 'bold' || textStyle === 'bold-italic' ? 'font-bold' : ''
        } ${
          textStyle === 'italic' || textStyle === 'bold-italic' ? 'italic' : ''
        }`}>
          {heading}
        </h2>
        <p className={`text-sm ${styleVariant === '2' ? 'font-medium' : ''} text-muted-foreground mt-1 ${
          textStyle === 'bold' || textStyle === 'bold-italic' ? 'font-bold' : ''
        } ${
          textStyle === 'italic' || textStyle === 'bold-italic' ? 'italic' : ''
        }`}>
          {subheading}
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="board" className={isEmbedded ? 'flex-1 flex flex-col min-h-0' : ''}>
        <div className={isEmbedded ? 'px-6' : ''}>
          <TabsList className="w-auto gap-4 bg-transparent p-0 h-auto border-b dark:border-white/10 pb-0 rounded-none">
            <TabsTrigger
              value="board"
              className="px-0 pb-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary transition-all data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-b-current"
              style={{ 
                '--tw-border-opacity': 1,
                ...(styleVariant === '2' && {
                  color: accentColor
                })
              } as any}
            >
              <span className="flex items-center gap-1.5">
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
              className="px-0 pb-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary transition-all data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-b-current"
              style={{ 
                '--tw-border-opacity': 1,
                ...(styleVariant === '2' && {
                  color: accentColor
                })
              } as any}
            >
              <span className="flex items-center gap-1.5">
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
        <TabsContent value="board" className={`pt-4 transition-all space-y-3 ${isEmbedded ? 'flex-1 flex flex-col min-h-0' : ''}`}>
          {/* Search and Create */}
          <div className={`flex ${styleVariant === '2' ? 'gap-3' : 'gap-2'} items-center ${isEmbedded ? 'px-6' : ''} ${styleVariant === '2' ? 'py-2' : ''}`}>
            <div className="relative flex-1">
              <Search className={`absolute ${styleVariant === '2' ? 'left-4' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60`} />
              <Input
                placeholder={styleVariant === '2' ? "Explore ideas..." : "Search posts..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styleVariant === '2' ? 'pl-12 pr-4 py-4 bg-white/30 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-2xl dark:text-white' : 'pl-9'}
              />
            </div>
            {styleVariant === '2' && (
              <button className="px-5 py-4 bg-muted/50 border border-border rounded-2xl text-muted-foreground hover:bg-muted transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M7 12h10M5 18h14" />
                </svg>
              </button>
            )}
            <Button
              onClick={onCreatePost}
              style={variantStyles.buttonStyle === 'solid' ? {
                backgroundColor: accentColor,
                color: 'white',
                boxShadow: styleVariant === '2' ? `0 0 20px ${hexToRgba(accentColor, 0.2)}` : undefined
              } : {}}
              className={`shrink-0 ${styleVariant === '2' ? 'px-8 py-4 font-bold shadow-xl' : borderRadiusClass} ${
                variantStyles.buttonStyle === 'outline'
                  ? 'border-2'
                  : 'text-white'
              }`}
            >
              {styleVariant === '2' ? (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 4v16m8-8H4" />
                  </svg>
                  New Post
                </span>
              ) : 'Create New Post'}
            </Button>
          </div>

          {/* Posts List - 3 distinct branches matching preview exactly */}
          <div className={`${isEmbedded ? 'flex-1 px-6' : 'max-h-80'} overflow-y-auto`}>
            {filteredPosts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {searchQuery ? 'No posts found matching your search.' : 'No posts yet. Be the first to create one!'}
              </div>
            ) : (
              <div className={`${styleVariant === '3' ? 'divide-y divide-border' : styleVariant === '2' ? 'space-y-4' : 'space-y-3'} pb-4`}>
                {filteredPosts.map((post) => {
                  const statusStyle = post.status ? getStatusStyle(post.status) : null

                  if (styleVariant === '3') {
                    // Style 3 - Supahub: content left, vote RIGHT, divider lines
                    return (
                      <div
                        key={post.id}
                        onClick={() => handlePostClick(post)}
                        className="py-4 first:pt-2 last:pb-2 hover:bg-muted/50 transition-colors cursor-pointer px-1"
                      >
                        <div className="flex items-start gap-4">
                          {/* Content first = appears LEFT */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground text-sm">{post.title}</h4>
                            {post.content && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{post.content}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2.5">
                              {post.author_name && (
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium text-white"
                                    style={{ backgroundColor: accentColor }}
                                  >
                                    {post.author_name.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-xs text-muted-foreground">{post.author_name}</span>
                                </div>
                              )}
                              {post.tags?.map((tag) => (
                                <Badge key={tag.name} className="bg-red-50 text-red-600 border-0 text-[10px] font-medium px-2 py-0.5 rounded">
                                  {tag.name}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Vote button second = appears RIGHT */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleVote(post.id)
                            }}
                            className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg border transition-colors shrink-0 ${
                              post.hasVoted
                                ? 'border-transparent text-white'
                                : 'border-border hover:border-border text-muted-foreground'
                            }`}
                            style={
                              post.hasVoted
                                ? { backgroundColor: accentColor }
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

                  if (styleVariant === '2') {
                    // Style 2 - Modern/Glass: larger elements, glow effects, hover animations
                    return (
                      <div
                        key={post.id}
                        onClick={() => handlePostClick(post)}
                        className={`p-6 ${variantStyles.cardBorder} ${borderRadiusClass} hover:border-border transition-all cursor-pointer hover:translate-y-[-2px] hover:shadow-md`}
                        style={{
                          ...variantStyles.cardStyle,
                          ...(post.hasVoted && {
                            borderColor: hexToRgba(accentColor, 0.3),
                            boxShadow: `0 0 20px ${hexToRgba(accentColor, 0.1)}`
                          })
                        }}
                      >
                        <div className="flex gap-6">
                          {/* Vote button LEFT - larger for style 2 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleVote(post.id)
                            }}
                            className={`flex flex-col items-center justify-center px-3 py-3 min-w-[64px] ${borderRadiusClass} border transition-colors shrink-0 ${
                              post.hasVoted
                                ? 'border-transparent text-white'
                                : 'bg-background hover:border-border'
                            }`}
                            style={
                              post.hasVoted
                                ? { backgroundColor: accentColor }
                                : { backgroundColor: isDark ? '#1a1a1a' : '#ffffff', border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)' }
                            }
                          >
                            <ChevronUp className="h-4 w-4" style={post.hasVoted ? {} : { color: isDark ? '#9ca3af' : '#6b7280' }} />
                            <span className={`text-lg font-extrabold ${post.hasVoted ? 'text-white' : 'text-foreground'}`}>
                              {post.votes}
                            </span>
                          </button>

                          {/* Content RIGHT - larger text for style 2 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="text-xl font-bold text-foreground line-clamp-1" style={post.hasVoted ? { color: accentColor } : {}}>
                                {post.title}
                              </h4>
                              {post.status && statusStyle && (
                                <Badge className={`${statusStyle.bg} ${statusStyle.text} border-0 text-[10px] font-bold uppercase tracking-widest rounded-full`}>
                                  {getStatusLabel(post.status)}
                                </Badge>
                              )}
                            </div>
                            {post.content && (
                              <p className="text-sm text-muted-foreground mb-4 leading-relaxed font-medium line-clamp-3">{post.content}</p>
                            )}
                            <div className="flex items-center gap-4">
                              {post.author_name && (
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                                    style={{ backgroundColor: accentColor }}
                                  >
                                    {post.author_name.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-xs font-bold text-foreground/80">{post.author_name}</span>
                                </div>
                              )}
                              {post.tags?.map((tag) => (
                                <Badge key={tag.name} variant="outline" className={`text-xs ${borderRadiusClass}`}>
                                  {tag.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  // Style 1 - Standard: bordered cards, vote left
                  return (
                    <div
                      key={post.id}
                      onClick={() => handlePostClick(post)}
                      className={`p-5 ${variantStyles.cardBorder} border-border ${borderRadiusClass} hover:border-border hover:shadow-lg transition-all cursor-pointer bg-linear-to-br from-background to-muted/30 hover:from-background hover:to-muted/50 shadow-sm`}
                    >
                      <div className="flex gap-3">
                        {/* Vote button LEFT */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleVote(post.id)
                          }}
                          className={`flex flex-col items-center justify-center px-3 py-2.5 ${borderRadiusClass} border transition-all shrink-0 cursor-pointer hover:scale-105 active:scale-95 ${
                            post.hasVoted
                              ? 'border-transparent text-white shadow-md'
                              : 'border-border hover:border-border hover:shadow-sm text-muted-foreground bg-muted/50 hover:bg-background'
                          }`}
                          style={
                            post.hasVoted
                              ? { 
                                  backgroundColor: accentColor,
                                  boxShadow: `0 4px 12px -2px ${accentColor}40`
                                }
                              : {}
                          }
                        >
                          <ChevronUp className="h-4 w-4" />
                          <span className="text-sm font-medium">{post.votes}</span>
                        </button>

                        {/* Content RIGHT */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-foreground text-base flex-1 hover:text-foreground/80 transition-colors">{post.title}</h4>
                            {post.status && statusStyle && (
                              <Badge className={`${statusStyle.bg} ${statusStyle.text} border-0 ${borderRadiusClass} text-xs`}>
                                {getStatusLabel(post.status)}
                              </Badge>
                            )}
                          </div>
                          {post.content && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{post.content}</p>
                          )}
                          <div className="flex items-center gap-3 mt-3">
                            {post.author_name && (
                              <div className="flex items-center gap-1.5">
                                <div
                                  className={`w-6 h-6 ${borderRadiusClass === 'rounded-none' ? 'rounded-full' : borderRadiusClass} flex items-center justify-center text-xs font-bold text-white shadow-sm`}
                                  style={{ backgroundColor: accentColor }}
                                >
                                  {post.author_name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-xs font-medium text-muted-foreground">{post.author_name}</span>
                              </div>
                            )}
                            {post.tags?.map((tag) => (
                              <Badge key={tag.name} variant="outline" className={`text-xs ${borderRadiusClass}`}>
                                {tag.name}
                              </Badge>
                            ))}
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
        <TabsContent value="changelog" className={`pt-4 transition-all ${isEmbedded ? 'flex-1 flex flex-col min-h-0' : ''}`}>
          <div className={`${isEmbedded ? 'flex-1 px-6' : 'max-h-80'} overflow-y-auto space-y-1`}>
            {changelog.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No changelog entries yet.
              </div>
            ) : (
              changelog.map((entry, index) => {
                const categoryStyle = getCategoryStyle(entry.category)
                const isExpanded = expandedChangelogId === entry.id || (expandedChangelogId === null && index === 0)
                return (
                  <div
                    key={entry.id}
                    className="border-b border-border dark:border-white/10 last:border-b-0 cursor-pointer -mx-3 px-4 py-3 rounded-xl transition-all hover:bg-muted/50"
                    onClick={() => setExpandedChangelogId(isExpanded && index !== 0 ? '__none__' : entry.id)}
                  >
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                      <Badge className={`${categoryStyle.bg} ${categoryStyle.text} border-0 shadow-md font-bold px-2.5 py-0.5`}>
                        {entry.category}
                      </Badge>
                      <span className="font-semibold">
                        {entry.published_at
                          ? formatDate(entry.published_at)
                          : 'Recently'}
                      </span>
                    </div>
                    <div className="font-bold text-lg text-foreground mb-1">{entry.title}</div>
                    {isExpanded ? (
                      <div
                        className="text-sm text-muted-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-3 [&_video]:max-w-full [&_video]:h-auto [&_a]:text-muted-foreground [&_a]:underline [&_a]:decoration-muted-foreground/40"
                        dangerouslySetInnerHTML={{ __html: entry.content || '' }}
                      />
                    ) : (
                      <div
                        className="text-sm text-muted-foreground line-clamp-2 leading-relaxed prose prose-sm dark:prose-invert max-w-none [&_img]:hidden [&_video]:hidden [&_audio]:hidden [&_a]:text-muted-foreground [&_a]:underline [&_a]:decoration-muted-foreground/40"
                        dangerouslySetInnerHTML={{ __html: entry.content || '' }}
                      />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      {isEmbedded ? (
        <div className="px-6 py-3 border-t dark:border-white/10 flex items-center justify-between">
          {showBranding ? (
            <span className="text-xs text-muted-foreground/60 flex items-center gap-1">
              <MessageSquare className="h-3 w-3" style={{ color: accentColor }} />
              Powered by Kelo
            </span>
          ) : (
            <span />
          )}
          <a
            href={`${typeof window !== 'undefined' ? window.location.origin : ''}/${orgSlug}/features`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium hover:underline"
            style={{ color: accentColor }}
          >
            View all posts
          </a>
        </div>
      ) : showBranding ? (
        <div className="pt-2 text-xs text-muted-foreground/60 text-center flex items-center justify-center gap-1">
          <MessageSquare className="h-3 w-3" style={{ color: accentColor }} />
          Powered by Kelo
        </div>
      ) : null}
    </div>
  )
}
