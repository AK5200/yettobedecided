'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, GripVertical, Trash2, Tag } from 'lucide-react'

interface TagData {
  id: string
  name: string
  color: string
}

interface TagManagerProps {
  orgId: string
}

const COLOR_OPTIONS = [
  { name: 'Gray', value: '#6B7280' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Green', value: '#10B981' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Teal', value: '#14B8A6' },
]

export function TagManager({ orgId }: TagManagerProps) {
  const [tags, setTags] = useState<TagData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newTag, setNewTag] = useState({
    name: '',
    color: '#6B7280',
  })

  const fetchTags = async () => {
    const response = await fetch(`/api/tags?org_id=${orgId}`)
    const data = await response.json()
    setTags(data.tags || [])
    setLoading(false)
  }

  useEffect(() => {
    if (orgId) fetchTags()
  }, [orgId])

  const handleCreateTag = async () => {
    if (!newTag.name.trim()) return
    setSaving(true)

    const response = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: orgId, name: newTag.name, color: newTag.color }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      toast.error(errorData.error || 'Failed to create tag')
    } else {
      toast.success('Tag created!')
      setNewTag({ name: '', color: '#6B7280' })
      setIsCreateDialogOpen(false)
      fetchTags()
    }
    setSaving(false)
  }

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return

    const response = await fetch(`/api/tags/${tagId}`, { method: 'DELETE' })

    if (!response.ok) {
      const errorData = await response.json()
      toast.error(errorData.error || 'Failed to delete tag')
    } else {
      toast.success('Tag deleted!')
      fetchTags()
    }
  }

  if (loading) {
    return (
      <div className="text-gray-500">Loading...</div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Add Tag Button */}
      <div className="flex justify-end">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Tag</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="tagName">Tag Name</Label>
                <Input
                  id="tagName"
                  placeholder="e.g., Bug, Enhancement, Question"
                  value={newTag.name}
                  onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setNewTag({ ...newTag, color: color.value })}
                      className={`w-8 h-8 rounded-full transition-all ${
                        newTag.color === color.value
                          ? 'ring-2 ring-offset-2 ring-amber-500'
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTag}
                  disabled={saving || !newTag.name.trim()}
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                >
                  {saving ? 'Creating...' : 'Create Tag'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tags List */}
      <div className="space-y-2">
        {tags.length === 0 ? (
          <Card className="p-8 text-center">
            <Tag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No tags yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Create your first tag to categorize feedback
            </p>
          </Card>
        ) : (
          tags.map((tag) => (
            <Card key={tag.id} className="p-4">
              <div className="flex items-center gap-4">
                <GripVertical className="h-5 w-5 text-gray-300 cursor-grab" />
                <div
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-gray-900">{tag.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteTag(tag.id)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
