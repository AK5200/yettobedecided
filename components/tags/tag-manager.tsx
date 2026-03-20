'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

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
  const { theme } = useTheme()
  const isDark = theme === 'dark'

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
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 rounded-full border-2 border-kelo-yellow border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Tag button */}
      <div className="flex justify-end">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-kelo-yellow text-kelo-ink font-semibold text-sm hover:bg-kelo-yellow-dark transition-colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Add Tag
            </button>
          </DialogTrigger>
          <DialogContent
            className={`sm:max-w-lg rounded-2xl ${
              isDark
                ? 'bg-[#111111] border-white/[0.07]'
                : 'bg-white border-kelo-border'
            }`}
          >
            <DialogHeader>
              <DialogTitle className={`font-display font-extrabold text-lg ${
                isDark ? 'text-white' : 'text-kelo-ink'
              }`}>
                Create New Tag
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 pt-2">
              {/* Tag Name Input */}
              <div className="space-y-2">
                <label
                  htmlFor="tagName"
                  className={`block text-sm font-semibold ${
                    isDark ? 'text-white' : 'text-kelo-ink'
                  }`}
                >
                  Tag Name
                </label>
                <input
                  id="tagName"
                  type="text"
                  placeholder="e.g., Bug, Enhancement, Question"
                  value={newTag.name}
                  onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newTag.name.trim()) handleCreateTag()
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors border ${
                    isDark
                      ? 'bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 focus:border-white/20'
                      : 'bg-kelo-surface border-kelo-border text-kelo-ink placeholder:text-kelo-muted focus:border-kelo-ink/20'
                  }`}
                />
              </div>

              {/* Color Picker */}
              <div className="space-y-2">
                <span
                  className={`block text-sm font-semibold ${
                    isDark ? 'text-white' : 'text-kelo-ink'
                  }`}
                >
                  Color
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setNewTag({ ...newTag, color: color.value })}
                      className={`w-8 h-8 rounded-full transition-all ${
                        newTag.color === color.value
                          ? 'ring-2 ring-offset-2 ring-kelo-yellow'
                          : 'hover:scale-110'
                      } ${isDark && newTag.color === color.value ? 'ring-offset-[#111111]' : ''}`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3">
                <button
                  onClick={() => setIsCreateDialogOpen(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isDark
                      ? 'text-white/60 hover:text-white hover:bg-white/[0.06]'
                      : 'text-kelo-muted hover:text-kelo-ink hover:bg-kelo-surface'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTag}
                  disabled={saving || !newTag.name.trim()}
                  className="px-4 py-2 rounded-lg bg-kelo-yellow text-kelo-ink font-semibold text-sm hover:bg-kelo-yellow-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-kelo-ink border-t-transparent animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    'Create Tag'
                  )}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tags List */}
      {tags.length === 0 ? (
        <div
          className={`rounded-2xl border p-10 text-center ${
            isDark
              ? 'bg-[#111111] border-white/[0.07]'
              : 'bg-white border-kelo-border'
          }`}
        >
          {/* Tag icon */}
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`mx-auto mb-4 ${isDark ? 'text-white/20' : 'text-kelo-muted/40'}`}
          >
            <path
              d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8 8a2 2 0 0 0 2.828 0l7.172-7.172a2 2 0 0 0 0-2.828l-8-8Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" />
          </svg>
          <p className={`font-semibold ${isDark ? 'text-white/60' : 'text-kelo-muted'}`}>
            No tags yet
          </p>
          <p className={`text-sm mt-1 ${isDark ? 'text-white/30' : 'text-kelo-muted/60'}`}>
            Create your first tag to categorize feedback
          </p>
        </div>
      ) : (
        <div
          className={`rounded-2xl border overflow-hidden divide-y ${
            isDark
              ? 'bg-[#111111] border-white/[0.07] divide-white/[0.07]'
              : 'bg-white border-kelo-border divide-kelo-border'
          }`}
        >
          {tags.map((tag) => (
            <div
              key={tag.id}
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-kelo-surface/50'
              }`}
            >
              <div
                className="w-3.5 h-3.5 rounded-full shrink-0"
                style={{ backgroundColor: tag.color }}
              />
              <span
                className={`flex-1 min-w-0 text-sm font-semibold truncate ${
                  isDark ? 'text-white' : 'text-kelo-ink'
                }`}
              >
                {tag.name}
              </span>
              <button
                onClick={() => handleDeleteTag(tag.id)}
                className={`shrink-0 p-1.5 rounded-lg transition-colors ${
                  isDark
                    ? 'text-white/30 hover:text-red-400 hover:bg-white/[0.06]'
                    : 'text-kelo-muted/50 hover:text-red-500 hover:bg-red-50'
                }`}
                title="Delete tag"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M2.5 4h11M5.5 4V2.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V4m1.5 0v9a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1V4h8ZM6.5 7v4M9.5 7v4"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
