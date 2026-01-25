'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

interface BoardSettingsFormProps {
  boardId: string
  initialValues: {
    name: string
    slug: string
    description: string
    isPublic: boolean
  }
}

export function BoardSettingsForm({ boardId, initialValues }: BoardSettingsFormProps) {
  const [name, setName] = useState(initialValues.name)
  const [slug, setSlug] = useState(initialValues.slug)
  const [description, setDescription] = useState(initialValues.description)
  const [isPublic, setIsPublic] = useState(initialValues.isPublic)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const response = await fetch(`/api/boards/${boardId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug, description, is_public: isPublic }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      toast.error(errorData.error || 'Failed to update board.')
    } else {
      toast.success('Board updated!')
      router.refresh()
    }

    setLoading(false)
  }

  const handleArchive = async () => {
    const confirmed = window.confirm('Archive this board? You can unarchive later.')
    if (!confirmed) return

    const response = await fetch(`/api/boards/${boardId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_archived: true }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      toast.error(errorData.error || 'Failed to archive board.')
    } else {
      toast.success('Board archived.')
      router.push('/boards')
    }
  }

  const handleDelete = async () => {
    const confirmed = window.confirm('Delete this board? This cannot be undone.')
    if (!confirmed) return

    const response = await fetch(`/api/boards/${boardId}`, { method: 'DELETE' })

    if (!response.ok) {
      const errorData = await response.json()
      toast.error(errorData.error || 'Failed to delete board.')
    } else {
      toast.success('Board deleted.')
      router.push('/boards')
    }
  }

  return (
    <div className="space-y-8 max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isPublic"
            checked={isPublic}
            onCheckedChange={(value) => setIsPublic(Boolean(value))}
          />
          <Label htmlFor="isPublic">Public board</Label>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>

      <div className="border-t pt-6 space-y-3">
        <h2 className="text-lg font-semibold">Danger Zone</h2>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleArchive}>
            Archive Board
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete Board
          </Button>
        </div>
      </div>
    </div>
  )
}
