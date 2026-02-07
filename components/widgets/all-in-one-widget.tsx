'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, ChevronUp, Zap } from 'lucide-react'
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

function getStatusStyle(status: string): { bg: string; text: string } {
  switch (status?.toLowerCase()) {
    case 'open':
      return { bg: 'bg-gray-100', text: 'text-gray-700' }
    case 'planned':
      return { bg: 'bg-blue-100', text: 'text-blue-700' }
    case 'in_progress':
      return { bg: 'bg-yellow-100', text: 'text-yellow-700' }
    case 'shipped':
      return { bg: 'bg-green-100', text: 'text-green-700' }
    case 'closed':
      return { bg: 'bg-gray-200', text: 'text-gray-600' }
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700' }
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
  styleVariant = '1',
  borderRadius = 'medium',
  isEmbedded = false,
  onCreatePost,
  onVote,
}: AllInOneWidgetProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [posts, setPosts] = useState(initialPosts)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchQuery.toLowerCase())
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
  
  // Helper function to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
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
            background: '#ffffff',
            border: 'none',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          },
          headerBg: 'transparent',
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
          headerBg: 'transparent',
          cardClass: '',
          cardStyle: {
            background: 'transparent',
            border: 'none',
          },
          cardBorder: 'border-b',
          buttonStyle: 'solid',
          borderRadius: borderRadiusClass,
          voteButtonClass: 'bg-white border border-gray-200',
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
      <div className={`${isEmbedded ? '' : borderRadiusClass} ${isEmbedded ? 'px-4 py-2' : 'p-4'} space-y-4`} style={isEmbedded ? {} : { backgroundColor }}>
        <PostDetailView
          post={selectedPost}
          orgSlug={orgSlug}
          accentColor={accentColor}
          onBack={handleBack}
          onVote={handleVote}
        />
        {showBranding && (
          <div className="pt-2 text-xs text-gray-400 text-center flex items-center justify-center gap-1">
            <Zap className="h-3 w-3" style={{ color: accentColor }} />
            Powered by FeedbackHub
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={`${isEmbedded ? '' : (variantStyles.borderRadius || borderRadiusClass)} ${isEmbedded ? 'px-4 py-2' : 'p-4'} space-y-4 ${variantStyles.containerClass}`}
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
        borderRadius: borderRadiusClass
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
          <Zap className="h-5 w-5" style={{ color: styleVariant === '2' ? 'white' : accentColor }} />
        </div>
        <h2 className={`${styleVariant === '2' ? 'text-3xl font-extrabold' : 'text-lg font-semibold'} text-gray-900 ${
          textStyle === 'bold' || textStyle === 'bold-italic' ? 'font-bold' : ''
        } ${
          textStyle === 'italic' || textStyle === 'bold-italic' ? 'italic' : ''
        }`}>
          {heading}
        </h2>
        <p className={`text-sm ${styleVariant === '2' ? 'font-medium' : ''} text-gray-500 mt-1 ${
          textStyle === 'bold' || textStyle === 'bold-italic' ? 'font-bold' : ''
        } ${
          textStyle === 'italic' || textStyle === 'bold-italic' ? 'italic' : ''
        }`}>
          {subheading}
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="board">
          <TabsList className="w-auto gap-4 bg-transparent p-0 h-auto border-b pb-0 rounded-none">
            <TabsTrigger
              value="board"
              className="px-0 pb-2 text-sm font-medium text-slate-500 hover:text-primary transition-all data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-b-current"
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
              className="px-0 pb-2 text-sm font-medium text-slate-500 hover:text-primary transition-all data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-b-current"
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

        {/* Board Tab */}
        <TabsContent value="board" className="pt-4 transition-all space-y-3">
          {/* Search and Create */}
          <div className="flex gap-2">
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
              onClick={onCreatePost}
              style={variantStyles.buttonStyle === 'solid' ? { backgroundColor: accentColor } : {}}
              className={`shrink-0 ${borderRadiusClass} ${
                variantStyles.buttonStyle === 'outline' 
                  ? 'border-2' 
                  : 'text-white'
              }`}
            >
              Create New Post
            </Button>
          </div>

          {/* Posts List */}
          <div className={`max-h-80 overflow-y-auto ${styleVariant === '3' ? 'divide-y divide-gray-200' : 'space-y-2'}`}>
            {filteredPosts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                {searchQuery ? 'No posts found matching your search.' : 'No posts yet. Be the first to create one!'}
              </div>
            ) : (
              filteredPosts.map((post) => {
                const statusStyle = post.status ? getStatusStyle(post.status) : null

                if (styleVariant === '3') {
                  // Supahub-style: content left, vote right, divider lines
                  return (
                    <div
                      key={post.id}
                      onClick={() => handlePostClick(post)}
                      className="py-4 first:pt-2 last:pb-2 hover:bg-gray-50 transition-colors cursor-pointer px-1"
                    >
                      <div className="flex items-start gap-4">
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm">{post.title}</h4>
                          {post.content && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{post.content}</p>
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
                                <span className="text-xs text-gray-500">{post.author_name}</span>
                              </div>
                            )}
                            {post.tags?.map((tag) => (
                              <Badge key={tag.name} className="bg-red-50 text-red-600 border-0 text-[10px] font-medium px-2 py-0.5 rounded">
                                {tag.name}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Vote button - right side */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleVote(post.id)
                          }}
                          className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg border transition-colors shrink-0 ${
                            post.hasVoted
                              ? 'border-transparent text-white'
                              : 'border-gray-200 hover:border-gray-300 text-gray-500'
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

                // Default style 1 & 2: vote left, card borders
                return (
                  <div
                    key={post.id}
                    onClick={() => handlePostClick(post)}
                    className={`p-3 ${variantStyles.cardBorder} border-gray-200 ${borderRadiusClass} hover:border-gray-300 transition-colors cursor-pointer`}
                  >
                    <div className="flex gap-3">
                      {/* Vote button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleVote(post.id)
                        }}
                        className={`flex flex-col items-center justify-center px-2.5 py-2 ${borderRadiusClass} border transition-colors shrink-0 ${
                          post.hasVoted
                            ? 'border-transparent text-white'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                        style={
                          post.hasVoted
                            ? { backgroundColor: accentColor }
                            : {}
                        }
                      >
                        <ChevronUp className="h-4 w-4" />
                        <span className="text-sm font-medium">{post.votes}</span>
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-gray-900 text-sm flex-1">{post.title}</h4>
                          {post.status && statusStyle && (
                            <Badge className={`${statusStyle.bg} ${statusStyle.text} border-0 ${borderRadiusClass} text-xs`}>
                              {getStatusLabel(post.status)}
                            </Badge>
                          )}
                        </div>
                        {post.content && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{post.content}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {post.author_name && (
                            <div className="flex items-center gap-1.5">
                              <div
                                className={`w-5 h-5 ${borderRadiusClass === 'rounded-none' ? 'rounded-full' : borderRadiusClass} flex items-center justify-center text-xs font-medium text-white`}
                                style={{ backgroundColor: accentColor }}
                              >
                                {post.author_name.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-xs text-gray-500">{post.author_name}</span>
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
              })
            )}
          </div>
        </TabsContent>

        {/* Changelog Tab */}
        <TabsContent value="changelog" className="pt-4 transition-all">
          <div className="max-h-80 overflow-y-auto space-y-4">
            {changelog.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No changelog entries yet.
              </div>
            ) : (
              changelog.map((entry) => {
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
                    <p className="text-sm text-gray-600 line-clamp-3 mt-1">{entry.content}</p>
                  </div>
                )
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      {showBranding && (
        <div className="pt-2 text-xs text-gray-400 text-center flex items-center justify-center gap-1">
          <Zap className="h-3 w-3" style={{ color: accentColor }} />
          Powered by FeedbackHub
        </div>
      )}
    </div>
  )
}
