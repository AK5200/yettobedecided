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
  guestCommentingEnabled?: boolean
}

function getCategoryStyle(category: string): { bg: string; text: string } {
  switch (category) {
    case 'feature':
      return { bg: 'bg-emerald-100 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' }
    case 'improvement':
      return { bg: 'bg-blue-100 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' }
    case 'fix':
      return { bg: 'bg-amber-100 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' }
    default:
      return { bg: 'bg-muted', text: 'text-muted-foreground' }
  }
}

function getStatusStyle(status: string): { bg: string; text: string } {
  switch (status?.toLowerCase()) {
    case 'open':
      return { bg: 'bg-slate-100 dark:bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400' }
    case 'planned':
      return { bg: 'bg-blue-100 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' }
    case 'in_progress':
      return { bg: 'bg-amber-100 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' }
    case 'shipped':
      return { bg: 'bg-emerald-100 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' }
    case 'closed':
      return { bg: 'bg-red-100 dark:bg-red-500/10', text: 'text-red-600 dark:text-red-400' }
    default:
      return { bg: 'bg-slate-100 dark:bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400' }
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
  backgroundColor,
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
  guestCommentingEnabled = true,
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

  const handlePostClick = (post: Post) => {
    setSelectedPost(post)
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
        // Modern/Glass style
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
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
            border: 'none',
            boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.08)',
          },
          cardBorder: '',
          buttonStyle: 'solid',
          borderRadius: 'rounded-2xl',
          voteButtonClass: 'bg-background border border-border',
        }
      case '3':
        // Clean editorial style (divider lines, vote on right)
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
          cardBorder: '',
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
      <div className={`${isEmbedded ? 'h-full flex flex-col' : borderRadiusClass} ${isEmbedded ? '' : 'p-4'} space-y-4 bg-white dark:bg-[#1a1a1a]`} style={isEmbedded ? {} : { backgroundColor: backgroundColor || undefined }}>
        <PostDetailView
          post={selectedPost}
          orgSlug={orgSlug}
          accentColor={accentColor}
          onBack={handleBack}
          onVote={handleVote}
          identifiedUser={identifiedUser}
          guestCommentingEnabled={guestCommentingEnabled}
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
      className={`${isEmbedded ? 'h-full flex flex-col' : (variantStyles.borderRadius || borderRadiusClass)} ${isEmbedded ? '' : 'p-5'} space-y-4 ${variantStyles.containerClass} bg-white dark:bg-[#1a1a1a] dark:text-white`}
      data-style-variant={styleVariant}
      style={isEmbedded ? {} : {
        backgroundColor: variantStyles.containerStyle?.background || backgroundColor || undefined,
        border: variantStyles.containerStyle?.border,
        boxShadow: variantStyles.containerStyle?.boxShadow,
        ...variantStyles.containerStyle
      }}
    >
      {/* Header */}
      <div className={`px-6 pt-6 pb-5`} style={{
        backgroundColor: headerBackgroundColor || variantStyles.headerBg || undefined,
        borderRadius: getBorderRadiusStyle(borderRadius)
      }}>
        <h2 className={`text-xl font-bold tracking-tight text-foreground ${
          textStyle === 'bold' || textStyle === 'bold-italic' ? 'font-bold' : ''
        } ${
          textStyle === 'italic' || textStyle === 'bold-italic' ? 'italic' : ''
        }`}>
          {heading}
        </h2>
        <p className={`text-sm text-muted-foreground mt-2 leading-relaxed ${
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
          <TabsList className="w-auto gap-6 bg-transparent p-0 h-auto border-b border-border/40 dark:border-white/10 pb-0 rounded-none">
            <TabsTrigger
              value="board"
              className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-200 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-b-2"
              style={{
                '--tw-border-opacity': 1,
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
              className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-200 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-b-2"
              style={{
                '--tw-border-opacity': 1,
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
        <TabsContent value="board" className={`pt-4 transition-all duration-200 space-y-4 ${isEmbedded ? 'flex-1 flex flex-col min-h-0' : ''}`}>
          {/* Search and Create */}
          <div className={`flex gap-3 items-center ${isEmbedded ? 'px-6' : ''}`}>
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-10 pr-4 rounded-xl border-border/60 dark:border-white/10 bg-transparent dark:bg-white/5 dark:text-white transition-all duration-200 focus:ring-2 focus:ring-offset-0"
                style={{ '--tw-ring-color': hexToRgba(accentColor, 0.3) } as any}
              />
            </div>
            <Button
              onClick={onCreatePost}
              style={{
                backgroundColor: accentColor,
                color: 'white',
                boxShadow: `0 2px 8px -2px ${hexToRgba(accentColor, 0.4)}`
              }}
              className="shrink-0 h-10 px-5 rounded-xl font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 4v16m8-8H4" />
                </svg>
                New Post
              </span>
            </Button>
          </div>

          {/* Posts List - 3 distinct branches matching preview exactly */}
          <div className={`${isEmbedded ? 'flex-1 px-6' : 'max-h-80'} overflow-y-auto`}>
            {filteredPosts.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                {searchQuery ? 'No posts found matching your search.' : 'No posts yet. Be the first to create one!'}
              </div>
            ) : (
              <div className={`${styleVariant === '3' ? '' : styleVariant === '2' ? 'space-y-4' : 'space-y-3'} pb-4`}>
                {filteredPosts.map((post) => {
                  const statusStyle = post.status ? getStatusStyle(post.status) : null

                  if (styleVariant === '3') {
                    // Style 3 - Clean editorial: no cards, divider lines, vote on right, minimal
                    return (
                      <div
                        key={post.id}
                        onClick={() => handlePostClick(post)}
                        className="py-5 border-b border-border/30 dark:border-white/10 last:border-b-0 hover:bg-muted/30 transition-all duration-200 cursor-pointer px-2"
                      >
                        <div className="flex items-start gap-4">
                          {/* Content first = appears LEFT */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground text-base leading-snug">{post.title}</h4>
                            {post.content && (
                              <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{post.content}</p>
                            )}
                            <div className="flex items-center gap-3 mt-3">
                              {post.status && statusStyle && (
                                <Badge className={`${statusStyle.bg} ${statusStyle.text} border-0 text-[10px] font-semibold px-2 py-0.5 rounded-full`}>
                                  {getStatusLabel(post.status)}
                                </Badge>
                              )}
                              {post.author_name && (
                                <span className="text-xs text-muted-foreground">{post.author_name}</span>
                              )}
                              {post.tags?.map((tag) => (
                                <Badge key={tag.name} variant="outline" className="text-[10px] font-medium px-2 py-0.5 rounded-full border-border/50">
                                  {tag.name}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Vote count on RIGHT - number only, minimal */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleVote(post.id)
                            }}
                            className="flex flex-col items-center justify-center shrink-0 transition-all duration-200"
                          >
                            <ChevronUp className="h-4 w-4 transition-colors duration-200" style={post.hasVoted ? { color: accentColor } : { color: isDark ? '#6b7280' : '#9ca3af' }} />
                            <span className="text-sm font-bold transition-colors duration-200" style={post.hasVoted ? { color: accentColor } : {}}>
                              {post.votes}
                            </span>
                          </button>
                        </div>
                      </div>
                    )
                  }

                  if (styleVariant === '2') {
                    // Style 2 - Modern/Glass: no border, shadow, rounded-2xl, glass feel
                    return (
                      <div
                        key={post.id}
                        onClick={() => handlePostClick(post)}
                        className="p-6 rounded-2xl transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg bg-white/80 dark:bg-white/5"
                        style={{
                          ...variantStyles.cardStyle,
                          ...(post.hasVoted && {
                            boxShadow: `0 4px 24px -4px ${hexToRgba(accentColor, 0.2)}`
                          })
                        }}
                      >
                        <div className="flex gap-5">
                          {/* Vote button LEFT - accent glow when active */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleVote(post.id)
                            }}
                            className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-200 shrink-0 ${
                              post.hasVoted
                                ? 'text-white'
                                : 'hover:shadow-sm'
                            }`}
                            style={
                              post.hasVoted
                                ? { backgroundColor: accentColor, boxShadow: `0 4px 16px -2px ${hexToRgba(accentColor, 0.4)}` }
                                : { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)' }
                            }
                          >
                            <ChevronUp className="h-4 w-4" style={post.hasVoted ? {} : { color: isDark ? '#9ca3af' : '#6b7280' }} />
                            <span className={`text-base font-bold ${post.hasVoted ? 'text-white' : 'text-foreground'}`}>
                              {post.votes}
                            </span>
                          </button>

                          {/* Content RIGHT - larger typography */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="text-base font-bold text-foreground line-clamp-1">
                                {post.title}
                              </h4>
                              {post.status && statusStyle && (
                                <Badge className={`${statusStyle.bg} ${statusStyle.text} border-0 text-[10px] font-semibold rounded-full px-2.5 py-0.5`}>
                                  {getStatusLabel(post.status)}
                                </Badge>
                              )}
                            </div>
                            {post.content && (
                              <p className="text-sm text-muted-foreground mb-3 leading-relaxed line-clamp-2">{post.content}</p>
                            )}
                            <div className="flex items-center gap-3">
                              {post.author_name && (
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                                    style={{ backgroundColor: accentColor }}
                                  >
                                    {post.author_name.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-xs font-medium text-muted-foreground">{post.author_name}</span>
                                </div>
                              )}
                              {post.tags?.map((tag) => (
                                <Badge key={tag.name} variant="outline" className="text-xs rounded-full">
                                  {tag.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  // Style 1 - Standard: bordered cards, vote left, hover elevation
                  return (
                    <div
                      key={post.id}
                      onClick={() => handlePostClick(post)}
                      className="p-5 border border-border/60 dark:border-white/10 rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer bg-background"
                    >
                      <div className="flex gap-4">
                        {/* Vote button LEFT - bordered square */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleVote(post.id)
                          }}
                          className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl border transition-all duration-200 shrink-0 ${
                            post.hasVoted
                              ? 'border-transparent text-white'
                              : 'border-border/60 dark:border-white/10 hover:shadow-sm hover:border-border text-muted-foreground'
                          }`}
                          style={
                            post.hasVoted
                              ? {
                                  backgroundColor: accentColor,
                                  boxShadow: `0 4px 14px -3px ${hexToRgba(accentColor, 0.4)}`
                                }
                              : {}
                          }
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                          <span className="text-xs font-bold">{post.votes}</span>
                        </button>

                        {/* Content RIGHT */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-foreground text-sm leading-snug flex-1">{post.title}</h4>
                            {post.status && statusStyle && (
                              <Badge className={`${statusStyle.bg} ${statusStyle.text} border-0 rounded-full text-[10px] font-semibold px-2 py-0.5`}>
                                {getStatusLabel(post.status)}
                              </Badge>
                            )}
                          </div>
                          {post.content && (
                            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{post.content}</p>
                          )}
                          <div className="flex items-center gap-3 mt-3">
                            {post.author_name && (
                              <div className="flex items-center gap-1.5">
                                <div
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                                  style={{ backgroundColor: accentColor }}
                                >
                                  {post.author_name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-xs text-muted-foreground">{post.author_name}</span>
                              </div>
                            )}
                            {post.tags?.map((tag) => (
                              <Badge key={tag.name} variant="outline" className="text-[10px] rounded-full border-border/50">
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
        <TabsContent value="changelog" className={`pt-4 transition-all duration-200 ${isEmbedded ? 'flex-1 flex flex-col min-h-0' : ''}`}>
          <div className={`${isEmbedded ? 'flex-1 px-6' : 'max-h-80'} overflow-y-auto`}>
            {changelog.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                No changelog entries yet.
              </div>
            ) : (
              changelog.map((entry, index) => {
                const categoryStyle = getCategoryStyle(entry.category)
                const isExpanded = expandedChangelogId === entry.id || (expandedChangelogId === null && index === 0)
                return (
                  <div
                    key={entry.id}
                    className="border-b border-border/30 dark:border-white/10 last:border-b-0 cursor-pointer px-3 py-5 rounded-xl transition-all duration-200 hover:bg-muted/40"
                    onClick={() => setExpandedChangelogId(isExpanded && index !== 0 ? '__none__' : entry.id)}
                  >
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2.5">
                      <Badge className={`${categoryStyle.bg} ${categoryStyle.text} border-0 font-semibold px-2.5 py-0.5 rounded-full text-[11px]`}>
                        {entry.category}
                      </Badge>
                      <span className="font-medium">
                        {entry.published_at
                          ? formatDate(entry.published_at)
                          : 'Recently'}
                      </span>
                    </div>
                    <div className="font-bold text-base text-foreground mb-1.5">{entry.title}</div>
                    {isExpanded ? (
                      <div
                        className="text-sm text-muted-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:my-3 [&_video]:max-w-full [&_video]:h-auto [&_a]:text-muted-foreground [&_a]:underline [&_a]:decoration-muted-foreground/40"
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
        <div className="px-6 py-4 border-t border-border/40 dark:border-white/10 flex items-center justify-between">
          {showBranding ? (
            <span className="text-xs text-muted-foreground/50 flex items-center gap-1.5">
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
            className="text-xs font-medium hover:underline transition-colors duration-200"
            style={{ color: accentColor }}
          >
            View all posts
          </a>
        </div>
      ) : showBranding ? (
        <div className="pt-3 text-xs text-muted-foreground/50 text-center flex items-center justify-center gap-1.5">
          <MessageSquare className="h-3 w-3" style={{ color: accentColor }} />
          Powered by Kelo
        </div>
      ) : null}
    </div>
  )
}
