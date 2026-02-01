'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Shield,
  MessageSquare,
  MessageCircle,
  Check,
  X,
  Clock,
  User,
  AlertCircle,
  BadgeCheck,
} from 'lucide-react'
import Image from 'next/image'

interface PendingPost {
  id: string
  title: string
  content: string
  author_name: string | null
  author_email: string | null
  guest_name: string | null
  guest_email: string | null
  identified_user_avatar: string | null
  user_source: string | null
  created_at: string
  board: { name: string }
}

interface PendingComment {
  id: string
  content: string
  author_name: string | null
  author_email: string | null
  identified_user_avatar: string | null
  user_source: string | null
  created_at: string
  post: { title: string }
}

export default function ModerationPage() {
  const supabase = createClient()
  const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([])
  const [pendingComments, setPendingComments] = useState<PendingComment[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchPendingItems()
  }, [])

  const fetchPendingItems = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) return

    // Fetch pending posts
    const { data: boards } = await supabase
      .from('boards')
      .select('id')
      .eq('org_id', membership.org_id)

    if (boards && boards.length > 0) {
      const { data: posts } = await supabase
        .from('posts')
        .select('id, title, content, author_name, author_email, guest_name, guest_email, identified_user_avatar, user_source, created_at, boards!inner(name)')
        .eq('is_approved', false)
        .in('board_id', boards.map((b: { id: string }) => b.id))
        .order('created_at', { ascending: false })

      setPendingPosts(
        (posts || []).map(p => ({
          ...p,
          board: { name: (p.boards as any)?.name || 'Unknown' }
        }))
      )

      // Fetch pending comments
      const { data: postIds } = await supabase
        .from('posts')
        .select('id')
        .in('board_id', boards.map((b: { id: string }) => b.id))

      if (postIds && postIds.length > 0) {
        const { data: comments } = await supabase
          .from('comments')
          .select('id, content, author_name, author_email, identified_user_avatar, user_source, created_at, posts!inner(title)')
          .eq('is_approved', false)
          .in('post_id', postIds.map((p: { id: string }) => p.id))
          .order('created_at', { ascending: false })

        setPendingComments(
          (comments || []).map(c => ({
            ...c,
            post: { title: (c.posts as any)?.title || 'Unknown' }
          }))
        )
      }
    }

    setLoading(false)
  }

  const approvePost = async (postId: string) => {
    setProcessingId(postId)
    const { error } = await supabase
      .from('posts')
      .update({ is_approved: true })
      .eq('id', postId)

    if (error) {
      toast.error('Failed to approve post')
    } else {
      toast.success('Post approved!')
      setPendingPosts(pendingPosts.filter(p => p.id !== postId))
    }
    setProcessingId(null)
  }

  const rejectPost = async (postId: string) => {
    if (!confirm('Are you sure you want to reject this post? It will be deleted.')) return

    setProcessingId(postId)
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)

    if (error) {
      toast.error('Failed to reject post')
    } else {
      toast.success('Post rejected and deleted')
      setPendingPosts(pendingPosts.filter(p => p.id !== postId))
    }
    setProcessingId(null)
  }

  const approveComment = async (commentId: string) => {
    setProcessingId(commentId)
    const { error } = await supabase
      .from('comments')
      .update({ is_approved: true })
      .eq('id', commentId)

    if (error) {
      toast.error('Failed to approve comment')
    } else {
      toast.success('Comment approved!')
      setPendingComments(pendingComments.filter(c => c.id !== commentId))
    }
    setProcessingId(null)
  }

  const rejectComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to reject this comment? It will be deleted.')) return

    setProcessingId(commentId)
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    if (error) {
      toast.error('Failed to reject comment')
    } else {
      toast.success('Comment rejected and deleted')
      setPendingComments(pendingComments.filter(c => c.id !== commentId))
    }
    setProcessingId(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex-1 bg-white p-8">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  const totalPending = pendingPosts.length + pendingComments.length

  return (
    <div className="flex-1 bg-white">
      {/* Header */}
      <div className="border-b">
        <div className="px-8 py-6">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-gray-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Moderation</h1>
              <p className="text-gray-500 text-sm">
                Review and approve posts and comments before they go live
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        {totalPending === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 mx-auto mb-4 flex items-center justify-center">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              There are no posts or comments waiting for moderation.
              New items will appear here when moderation is enabled.
            </p>
          </Card>
        ) : (
          <Tabs defaultValue="posts">
            <TabsList className="bg-transparent h-auto p-0 gap-0 border-b mb-6">
              <TabsTrigger
                value="posts"
                className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-gray-600 data-[state=active]:text-gray-900"
              >
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Posts
                  {pendingPosts.length > 0 && (
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                      {pendingPosts.length}
                    </Badge>
                  )}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="comments"
                className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-gray-600 data-[state=active]:text-gray-900"
              >
                <span className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Comments
                  {pendingComments.length > 0 && (
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                      {pendingComments.length}
                    </Badge>
                  )}
                </span>
              </TabsTrigger>
            </TabsList>

            {/* Posts Tab */}
            <TabsContent value="posts" className="space-y-4">
              {pendingPosts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p>No posts pending moderation</p>
                </div>
              ) : (
                pendingPosts.map((post) => {
                  const displayName = post.author_name || post.guest_name || post.author_email || post.guest_email || 'Anonymous'
                  const isVerified = post.user_source === 'verified_sso'

                  return (
                    <Card key={post.id} className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                          <Clock className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900">{post.title}</h3>
                            <Badge variant="outline" className="text-xs">
                              {post.board.name}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {post.content || 'No description'}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {post.identified_user_avatar ? (
                              <Image
                                src={post.identified_user_avatar}
                                alt={displayName}
                                width={16}
                                height={16}
                                className="rounded-full"
                              />
                            ) : (
                              <User className="h-4 w-4" />
                            )}
                            <span>{displayName}</span>
                            {isVerified && (
                              <span className="inline-flex items-center gap-0.5 text-green-600 font-medium">
                                <BadgeCheck className="h-3.5 w-3.5" />
                                Verified
                              </span>
                            )}
                            <span className="text-gray-400">•</span>
                            <span>{formatDate(post.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => rejectPost(post.id)}
                            disabled={processingId === post.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => approvePost(post.id)}
                            disabled={processingId === post.id}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )
                })
              )}
            </TabsContent>

            {/* Comments Tab */}
            <TabsContent value="comments" className="space-y-4">
              {pendingComments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p>No comments pending moderation</p>
                </div>
              ) : (
                pendingComments.map((comment) => {
                  const displayName = comment.author_name || comment.author_email || 'Anonymous'
                  const isVerified = comment.user_source === 'verified_sso'

                  return (
                    <Card key={comment.id} className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                          <MessageCircle className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-gray-500">Comment on:</span>
                            <span className="font-medium text-gray-900">{comment.post.title}</span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-3 mb-2">
                            {comment.content}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {comment.identified_user_avatar ? (
                              <Image
                                src={comment.identified_user_avatar}
                                alt={displayName}
                                width={16}
                                height={16}
                                className="rounded-full"
                              />
                            ) : (
                              <User className="h-4 w-4" />
                            )}
                            <span>{displayName}</span>
                            {isVerified && (
                              <span className="inline-flex items-center gap-0.5 text-green-600 font-medium">
                                <BadgeCheck className="h-3.5 w-3.5" />
                                Verified
                              </span>
                            )}
                            <span className="text-gray-400">•</span>
                            <span>{formatDate(comment.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => rejectComment(comment.id)}
                            disabled={processingId === comment.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => approveComment(comment.id)}
                            disabled={processingId === comment.id}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )
                })
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Info Card */}
        <Card className="mt-8 p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Moderation Settings</h4>
              <p className="text-sm text-blue-700 mt-1">
                Enable or disable post and comment moderation in{' '}
                <a href="/settings/boards" className="underline font-medium">
                  Settings → Boards → Moderation & Permissions
                </a>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
