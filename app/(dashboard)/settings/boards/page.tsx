'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Plus,
  Settings,
  MessageSquare,
  Eye,
  EyeOff,
  Trash2,
  GripVertical,
  Crown,
  Shield,
  Users,
  MessageCircle,
  UserX,
} from 'lucide-react'

interface Board {
  id: string
  name: string
  slug: string
  description: string | null
  is_public: boolean
  allow_comments: boolean
  allow_voting: boolean
  created_at: string
}

interface ModerationSettings {
  post_moderation: boolean
  comment_moderation: boolean
  allow_anonymous_posts: boolean
  allow_guest_posts: boolean
  allow_guest_votes: boolean
}

export default function BoardsSettingsPage() {
  const supabase = createClient()
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null)
  const [newBoardName, setNewBoardName] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [moderationSettings, setModerationSettings] = useState<ModerationSettings>({
    post_moderation: false,
    comment_moderation: false,
    allow_anonymous_posts: false,
    allow_guest_posts: false,
    allow_guest_votes: false,
  })

  useEffect(() => {
    fetchBoards()
    fetchModerationSettings()
  }, [])

  const fetchBoards = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) return

    const { data } = await supabase
      .from('boards')
      .select('*')
      .eq('org_id', membership.org_id)
      .order('created_at', { ascending: true })

    setBoards(data || [])
    setLoading(false)
  }

  const fetchModerationSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: membership } = await supabase
      .from('org_members')
      .select('organizations(*)')
      .eq('user_id', user.id)
      .single()

    if (membership?.organizations) {
      const org = membership.organizations as any
      setModerationSettings({
        post_moderation: org.post_moderation ?? false,
        comment_moderation: org.comment_moderation ?? false,
        allow_anonymous_posts: org.allow_anonymous_posts ?? false,
        allow_guest_posts: org.allow_guest_posts ?? false,
        allow_guest_votes: org.allow_guest_votes ?? false,
      })
    }
  }

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) return

    const slug = newBoardName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    const { error } = await supabase
      .from('boards')
      .insert({
        org_id: membership.org_id,
        name: newBoardName,
        slug,
        is_public: true,
        allow_comments: true,
        allow_voting: true,
      })

    if (error) {
      toast.error('Failed to create board')
    } else {
      toast.success('Board created!')
      setNewBoardName('')
      setIsCreateDialogOpen(false)
      fetchBoards()
    }
    setSaving(false)
  }

  const handleUpdateBoard = async (board: Board) => {
    setSaving(true)
    const { error } = await supabase
      .from('boards')
      .update({
        name: board.name,
        is_public: board.is_public,
        allow_comments: board.allow_comments,
        allow_voting: board.allow_voting,
      })
      .eq('id', board.id)

    if (error) {
      toast.error('Failed to update board')
    } else {
      toast.success('Board updated!')
      fetchBoards()
    }
    setSaving(false)
    setSelectedBoard(null)
  }

  const handleDeleteBoard = async (boardId: string) => {
    if (!confirm('Are you sure you want to delete this board? All posts will be deleted.')) return

    const { error } = await supabase
      .from('boards')
      .delete()
      .eq('id', boardId)

    if (error) {
      toast.error('Failed to delete board')
    } else {
      toast.success('Board deleted!')
      fetchBoards()
    }
  }

  const handleSaveModerationSettings = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) return

    const { error } = await supabase
      .from('organizations')
      .update(moderationSettings)
      .eq('id', membership.org_id)

    if (error) {
      toast.error('Failed to save moderation settings')
    } else {
      toast.success('Moderation settings saved!')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Boards</h1>
      <p className="text-gray-500 mb-8">
        Manage your feedback boards and moderation settings.
      </p>

      <Tabs defaultValue="boards">
        <TabsList className="bg-transparent h-auto p-0 gap-0 border-b mb-6">
          <TabsTrigger
            value="boards"
            className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-gray-600 data-[state=active]:text-gray-900"
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Boards Settings
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

        {/* Boards Settings Tab */}
        <TabsContent value="boards" className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Configure your feedback boards. Each board can have its own settings.
            </p>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gray-900 hover:bg-gray-800">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Board
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Board</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="boardName">Board Name</Label>
                    <Input
                      id="boardName"
                      placeholder="e.g., Feature Requests"
                      value={newBoardName}
                      onChange={(e) => setNewBoardName(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateBoard} disabled={saving || !newBoardName.trim()}>
                      {saving ? 'Creating...' : 'Create Board'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Boards List */}
          <div className="space-y-3">
            {boards.length === 0 ? (
              <Card className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No boards yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Create your first board to start collecting feedback
                </p>
              </Card>
            ) : (
              boards.map((board) => (
                <Card key={board.id} className="p-4">
                  <div className="flex items-center gap-4">
                    <GripVertical className="h-5 w-5 text-gray-300 cursor-grab" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{board.name}</h3>
                        {!board.is_public && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            Private
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">/{board.slug}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedBoard(board)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBoard(board.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Moderation & Permissions Tab */}
        <TabsContent value="moderation" className="space-y-6">
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
              <Switch
                checked={moderationSettings.post_moderation}
                onCheckedChange={(checked) =>
                  setModerationSettings({ ...moderationSettings, post_moderation: checked })
                }
              />
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
              <Switch
                checked={moderationSettings.comment_moderation}
                onCheckedChange={(checked) =>
                  setModerationSettings({ ...moderationSettings, comment_moderation: checked })
                }
              />
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
              <Switch
                checked={moderationSettings.allow_anonymous_posts}
                onCheckedChange={(checked) =>
                  setModerationSettings({ ...moderationSettings, allow_anonymous_posts: checked })
                }
              />
            </div>
          </Card>

          {/* Guest Posts & Votes */}
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    Guest Posts & Votes
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded flex items-center gap-1">
                      <Crown className="h-3 w-3" />
                      Upgrade
                    </span>
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Allow users to submit feedback and vote without creating an account.
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={moderationSettings.allow_guest_posts}
                        onChange={(e) =>
                          setModerationSettings({
                            ...moderationSettings,
                            allow_guest_posts: e.target.checked,
                          })
                        }
                        className="rounded border-gray-300"
                        disabled
                      />
                      Allow guest posts
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={moderationSettings.allow_guest_votes}
                        onChange={(e) =>
                          setModerationSettings({
                            ...moderationSettings,
                            allow_guest_votes: e.target.checked,
                          })
                        }
                        className="rounded border-gray-300"
                        disabled
                      />
                      Allow guest votes
                    </label>
                  </div>
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

      {/* Board Settings Dialog */}
      <Dialog open={!!selectedBoard} onOpenChange={() => setSelectedBoard(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Board Settings</DialogTitle>
          </DialogHeader>
          {selectedBoard && (
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="editBoardName">Board Name</Label>
                <Input
                  id="editBoardName"
                  value={selectedBoard.name}
                  onChange={(e) =>
                    setSelectedBoard({ ...selectedBoard, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <h4 className="font-medium text-gray-900">Board Visibility</h4>
                    <p className="text-sm text-gray-500">Make this board public or private</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedBoard.is_public ? (
                      <Eye className="h-4 w-4 text-gray-400" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                    <Switch
                      checked={selectedBoard.is_public}
                      onCheckedChange={(checked) =>
                        setSelectedBoard({ ...selectedBoard, is_public: checked })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <h4 className="font-medium text-gray-900">Allow Comments</h4>
                    <p className="text-sm text-gray-500">Users can comment on posts</p>
                  </div>
                  <Switch
                    checked={selectedBoard.allow_comments}
                    onCheckedChange={(checked) =>
                      setSelectedBoard({ ...selectedBoard, allow_comments: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <h4 className="font-medium text-gray-900">Allow Voting</h4>
                    <p className="text-sm text-gray-500">Users can upvote posts</p>
                  </div>
                  <Switch
                    checked={selectedBoard.allow_voting}
                    onCheckedChange={(checked) =>
                      setSelectedBoard({ ...selectedBoard, allow_voting: checked })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setSelectedBoard(null)}>
                  Cancel
                </Button>
                <Button onClick={() => handleUpdateBoard(selectedBoard)} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
