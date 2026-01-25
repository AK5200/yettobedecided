'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TagBadge } from './tag-badge'

interface Tag {
  id: string
  name: string
  color: string
}

interface TagManagerProps {
  orgId: string
}

export function TagManager({ orgId }: TagManagerProps) {
  const [tags, setTags] = useState<Tag[]>([])
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6B7280')
  const [loading, setLoading] = useState(false)

  const fetchTags = async () => {
    const response = await fetch(`/api/tags?org_id=${orgId}`)
    const data = await response.json()
    setTags(data.tags || [])
  }

  useEffect(() => {
    if (orgId) fetchTags()
  }, [orgId])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const response = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: orgId, name, color }),
    })
    if (!response.ok) {
      const errorData = await response.json()
      toast.error(errorData.error || 'Failed to create tag.')
    } else {
      await fetchTags()
      setName('')
      setColor('#6B7280')
      toast.success('Tag created.')
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Delete this tag?')
    if (!confirmed) return
    const response = await fetch(`/api/tags/${id}`, { method: 'DELETE' })
    if (!response.ok) {
      const errorData = await response.json()
      toast.error(errorData.error || 'Failed to delete tag.')
      return
    }
    setTags((prev) => prev.filter((tag) => tag.id !== id))
    toast.success('Tag deleted.')
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="space-y-4 border rounded-lg p-6">
        <h2 className="text-lg font-semibold">Create Tag</h2>
        <div className="space-y-2">
          <Label htmlFor="tag-name">Name</Label>
          <Input id="tag-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tag-color">Color</Label>
          <Input id="tag-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Tag'}
        </Button>
      </form>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Existing Tags</h2>
        {tags.length === 0 ? (
          <p className="text-sm text-gray-600">No tags created yet.</p>
        ) : (
          <div className="space-y-2">
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center justify-between">
                <TagBadge name={tag.name} color={tag.color} />
                <Button variant="destructive" onClick={() => handleDelete(tag.id)}>
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
