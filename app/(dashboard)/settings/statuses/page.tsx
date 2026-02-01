'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
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
import { toast } from 'sonner'
import { Plus, GripVertical, Trash2, Circle, Crown } from 'lucide-react'

interface Status {
  id: string
  name: string
  color: string
  order: number
  is_default: boolean
  show_on_roadmap: boolean
}

const DEFAULT_STATUSES: Omit<Status, 'id'>[] = [
  { name: 'Backlog', color: '#6B7280', order: 0, is_default: true, show_on_roadmap: false },
  { name: 'Planned', color: '#3B82F6', order: 1, is_default: false, show_on_roadmap: true },
  { name: 'In Progress', color: '#F59E0B', order: 2, is_default: false, show_on_roadmap: true },
  { name: 'Completed', color: '#10B981', order: 3, is_default: false, show_on_roadmap: true },
  { name: 'Closed', color: '#EF4444', order: 4, is_default: false, show_on_roadmap: false },
]

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

export default function StatusesSettingsPage() {
  const supabase = createClient()
  const [statuses, setStatuses] = useState<Status[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingStatus, setEditingStatus] = useState<Status | null>(null)
  const [newStatus, setNewStatus] = useState({
    name: '',
    color: '#6B7280',
    show_on_roadmap: false,
  })

  useEffect(() => {
    fetchStatuses()
  }, [])

  const fetchStatuses = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (!membership) return

    const { data } = await supabase
      .from('statuses')
      .select('*')
      .eq('org_id', membership.org_id)
      .order('order', { ascending: true })

    if (data && data.length > 0) {
      setStatuses(data)
    } else {
      // Initialize with default statuses if none exist
      setStatuses(DEFAULT_STATUSES.map((s, i) => ({ ...s, id: `default-${i}` })))
    }
    setLoading(false)
  }

  const handleCreateStatus = async () => {
    if (!newStatus.name.trim()) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (!membership) return

    const { error } = await supabase
      .from('statuses')
      .insert({
        org_id: membership.org_id,
        name: newStatus.name,
        color: newStatus.color,
        order: statuses.length,
        is_default: false,
        show_on_roadmap: newStatus.show_on_roadmap,
      })

    if (error) {
      toast.error('Failed to create status')
    } else {
      toast.success('Status created!')
      setNewStatus({ name: '', color: '#6B7280', show_on_roadmap: false })
      setIsCreateDialogOpen(false)
      fetchStatuses()
    }
    setSaving(false)
  }

  const handleUpdateStatus = async (status: Status) => {
    setSaving(true)
    const { error } = await supabase
      .from('statuses')
      .update({
        name: status.name,
        color: status.color,
        show_on_roadmap: status.show_on_roadmap,
      })
      .eq('id', status.id)

    if (error) {
      toast.error('Failed to update status')
    } else {
      toast.success('Status updated!')
      fetchStatuses()
    }
    setSaving(false)
    setEditingStatus(null)
  }

  const handleDeleteStatus = async (statusId: string) => {
    if (!confirm('Are you sure you want to delete this status?')) return

    const { error } = await supabase
      .from('statuses')
      .delete()
      .eq('id', statusId)

    if (error) {
      toast.error('Failed to delete status')
    } else {
      toast.success('Status deleted!')
      fetchStatuses()
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Statuses</h1>
      <p className="text-gray-500 mb-8">
        Customize the statuses for your feedback posts. Drag to reorder.
      </p>

      {/* Upgrade Banner */}
      <Card className="p-4 mb-6 bg-amber-50 border-amber-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Crown className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Custom Statuses</h3>
              <p className="text-sm text-gray-600">
                Upgrade to create and customize your own statuses
              </p>
            </div>
          </div>
          <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
            Upgrade
          </Button>
        </div>
      </Card>

      {/* Add Status Button */}
      <div className="flex justify-end mb-4">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gray-900 hover:bg-gray-800">
              <Plus className="h-4 w-4 mr-2" />
              Add Status
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="statusName">Status Name</Label>
                <Input
                  id="statusName"
                  placeholder="e.g., Under Review"
                  value={newStatus.name}
                  onChange={(e) => setNewStatus({ ...newStatus, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setNewStatus({ ...newStatus, color: color.value })}
                      className={`w-8 h-8 rounded-full transition-all ${
                        newStatus.color === color.value
                          ? 'ring-2 ring-offset-2 ring-gray-400'
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showOnRoadmap"
                  checked={newStatus.show_on_roadmap}
                  onChange={(e) =>
                    setNewStatus({ ...newStatus, show_on_roadmap: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <Label htmlFor="showOnRoadmap" className="text-sm font-normal">
                  Show on public roadmap
                </Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateStatus} disabled={saving || !newStatus.name.trim()}>
                  {saving ? 'Creating...' : 'Create Status'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statuses List */}
      <div className="space-y-2">
        {statuses.map((status) => (
          <Card key={status.id} className="p-4">
            <div className="flex items-center gap-4">
              <GripVertical className="h-5 w-5 text-gray-300 cursor-grab" />
              <Circle
                className="h-4 w-4 shrink-0"
                style={{ color: status.color, fill: status.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{status.name}</span>
                  {status.is_default && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      Default
                    </span>
                  )}
                  {status.show_on_roadmap && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                      Roadmap
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingStatus(status)}
                >
                  Edit
                </Button>
                {!status.is_default && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteStatus(status.id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Status Dialog */}
      <Dialog open={!!editingStatus} onOpenChange={() => setEditingStatus(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Status</DialogTitle>
          </DialogHeader>
          {editingStatus && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="editStatusName">Status Name</Label>
                <Input
                  id="editStatusName"
                  value={editingStatus.name}
                  onChange={(e) =>
                    setEditingStatus({ ...editingStatus, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() =>
                        setEditingStatus({ ...editingStatus, color: color.value })
                      }
                      className={`w-8 h-8 rounded-full transition-all ${
                        editingStatus.color === color.value
                          ? 'ring-2 ring-offset-2 ring-gray-400'
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editShowOnRoadmap"
                  checked={editingStatus.show_on_roadmap}
                  onChange={(e) =>
                    setEditingStatus({ ...editingStatus, show_on_roadmap: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <Label htmlFor="editShowOnRoadmap" className="text-sm font-normal">
                  Show on public roadmap
                </Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingStatus(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => handleUpdateStatus(editingStatus)}
                  disabled={saving}
                >
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
