'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  ChevronLeft,
  Settings,
  Shield,
  MessageCircle,
  UserX,
  Users,
  Eye,
  EyeOff,
  Trash2,
  Archive,
  ArchiveRestore,
} from 'lucide-react'

interface Board {
  id: string
  name: string
  slug: string
  description: string | null
  is_public: boolean
  is_archived: boolean
  allow_comments?: boolean
  allow_voting?: boolean
  require_approval?: boolean
}

interface OrgSettings {
  post_moderation: boolean
  comment_moderation: boolean
  allow_anonymous_posts: boolean
  allow_guest_posts: boolean
  allow_guest_votes: boolean
}

interface BoardSettingsPageProps {
  board: Board
  orgSettings: OrgSettings
}

export function BoardSettingsPage({ board, orgSettings }: BoardSettingsPageProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  // Board settings state
  const [name, setName] = useState(board.name)
  const [slug, setSlug] = useState(board.slug)
  const [description, setDescription] = useState(board.description || '')
  const [isPublic, setIsPublic] = useState(board.is_public)
  const [allowComments, setAllowComments] = useState(board.allow_comments ?? true)
  const [allowVoting, setAllowVoting] = useState(board.allow_voting ?? true)
  const [requireApproval, setRequireApproval] = useState(board.require_approval ?? orgSettings.post_moderation)

  // Moderation settings state (org-level)
  const [postModeration, setPostModeration] = useState(orgSettings.post_moderation)
  const [commentModeration, setCommentModeration] = useState(orgSettings.comment_moderation)
  const [allowAnonymousPosts, setAllowAnonymousPosts] = useState(orgSettings.allow_anonymous_posts)
  const [allowGuestPosts, setAllowGuestPosts] = useState(orgSettings.allow_guest_posts)
  const [allowGuestVotes, setAllowGuestVotes] = useState(orgSettings.allow_guest_votes)

  const handleSaveBoardSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/boards/${board.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          description,
          is_public: isPublic,
          allow_comments: allowComments,
          allow_voting: allowVoting,
          require_approval: requireApproval,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        toast.error(data.error || 'Failed to update board')
      } else {
        toast.success('Board settings saved!')
        router.refresh()
      }
    } catch {
      toast.error('Failed to update board')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveModerationSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/organization/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_moderation: postModeration,
          comment_moderation: commentModeration,
          allow_anonymous_posts: allowAnonymousPosts,
          allow_guest_posts: allowGuestPosts,
          allow_guest_votes: allowGuestVotes,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        toast.error(data.error || 'Failed to save moderation settings')
      } else {
        toast.success('Moderation settings saved!')
        router.refresh()
      }
    } catch {
      toast.error('Failed to save moderation settings')
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async () => {
    if (!confirm('Archive this board? You can unarchive later.')) return

    try {
      const response = await fetch(`/api/boards/${board.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_archived: true }),
      })

      if (!response.ok) {
        toast.error('Failed to archive board')
        return
      }

      toast.success('Board archived')
      router.push('/feedback')
    } catch {
      toast.error('Failed to archive board')
    }
  }

  const handleUnarchive = async () => {
    try {
      const response = await fetch(`/api/boards/${board.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_archived: false }),
      })

      if (!response.ok) {
        toast.error('Failed to unarchive board')
        return
      }

      toast.success('Board unarchived')
      router.refresh()
    } catch {
      toast.error('Failed to unarchive board')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this board permanently? This cannot be undone.')) return

    try {
      const response = await fetch(`/api/boards/${board.id}`, { method: 'DELETE' })

      if (!response.ok) {
        toast.error('Failed to delete board')
        return
      }

      toast.success('Board deleted')
      router.push('/feedback')
    } catch {
      toast.error('Failed to delete board')
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/boards/${board.id}`}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to {board.name}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Board Settings</h1>
        <p className="text-gray-500 mt-1">Configure settings for {board.name}</p>
      </div>

      {board.is_archived && (
        <Card className="p-4 bg-yellow-50 border-yellow-200 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-yellow-800">This board is archived</p>
              <p className="text-sm text-yellow-700">Unarchive to make it active again</p>
            </div>
            <Button variant="outline" onClick={handleUnarchive}>
              <ArchiveRestore className="h-4 w-4 mr-2" />
              Unarchive
            </Button>
          </div>
        </Card>
      )}

      <Tabs defaultValue="general">
        <TabsList className="bg-transparent h-auto p-0 gap-0 border-b mb-6 w-full justify-start">
          <TabsTrigger
            value="general"
            className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-gray-600 data-[state=active]:text-gray-900"
          >
            <span className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              General
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="moderation"
            className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-gray-600 data-[state=active]:text-gray-900"
          >
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Moderation & Permissions
            </span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          {/* Board Info */}
          <Card className="p-6">
            <h3 className="font-medium text-gray-900 mb-4">Board Information</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Feature Requests"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="feature-requests"
                />
                <p className="text-xs text-gray-500">Used in URLs: /boards/{slug || 'your-slug'}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this board is for..."
                  rows={3}
                />
              </div>
            </div>
          </Card>

          {/* Visibility & Features */}
          <Card className="p-6">
            <h3 className="font-medium text-gray-900 mb-4">Visibility & Features</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    {isPublic ? (
                      <Eye className="h-5 w-5 text-blue-600" />
                    ) : (
                      <EyeOff className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Public Board</h4>
                    <p className="text-sm text-gray-500">
                      Make this board visible to anyone with the link
                    </p>
                  </div>
                </div>
                <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                    <MessageCircle className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Allow Comments</h4>
                    <p className="text-sm text-gray-500">Users can comment on posts in this board</p>
                  </div>
                </div>
                <Switch checked={allowComments} onCheckedChange={setAllowComments} />
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Allow Voting</h4>
                    <p className="text-sm text-gray-500">Users can upvote posts in this board</p>
                  </div>
                </div>
                <Switch checked={allowVoting} onCheckedChange={setAllowVoting} />
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSaveBoardSettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>

          {/* Danger Zone */}
          <Card className="p-6 border-red-200">
            <h3 className="font-medium text-red-900 mb-4">Danger Zone</h3>
            <div className="flex gap-3">
              {!board.is_archived && (
                <Button variant="outline" onClick={handleArchive}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive Board
                </Button>
              )}
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Board
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Moderation & Permissions Tab */}
        <TabsContent value="moderation" className="space-y-6">
          <p className="text-sm text-gray-500 mb-4">
            These settings apply to all boards in your organization.
          </p>

          {/* Post Moderation */}
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Post Moderation</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    When enabled, all new posts will require admin approval before being visible to other users.
                  </p>
                </div>
              </div>
              <Switch checked={postModeration} onCheckedChange={setPostModeration} />
            </div>
          </Card>

          {/* Comment Moderation */}
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                  <MessageCircle className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Comment Moderation</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    When enabled, all new comments will require admin approval before being visible.
                  </p>
                </div>
              </div>
              <Switch checked={commentModeration} onCheckedChange={setCommentModeration} />
            </div>
          </Card>

          {/* Anonymous Posts */}
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <UserX className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Anonymous Posts</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Allow users to submit feedback anonymously. Their identity won't be shown publicly.
                  </p>
                </div>
              </div>
              <Switch checked={allowAnonymousPosts} onCheckedChange={setAllowAnonymousPosts} />
            </div>
          </Card>

          {/* Guest Posts & Votes */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Guest Posts & Votes</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Allow users to submit feedback and vote without creating an account.
                </p>
                <div className="flex items-center gap-6 mt-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={allowGuestPosts}
                      onChange={(e) => setAllowGuestPosts(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    Allow guest posts
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={allowGuestVotes}
                      onChange={(e) => setAllowGuestVotes(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    Allow guest votes
                  </label>
                </div>
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveModerationSettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
