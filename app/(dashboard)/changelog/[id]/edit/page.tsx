'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RichTextEditor } from '@/components/changelog/rich-text-editor'
import { ChangelogPreview } from '@/components/changelog/changelog-preview'
import { Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditChangelogPage({ params }: PageProps) {
  const [id, setId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('feature')
  const [isPublished, setIsPublished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [orgId, setOrgId] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const initialize = async () => {
      const { id: entryId } = await params
      setId(entryId)

      // Get org ID
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: membership } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      if (!membership) return
      setOrgId(membership.org_id)

      // Fetch entry
      const { data: entry, error: fetchError } = await supabase
        .from('changelog_entries')
        .select('*')
        .eq('id', entryId)
        .eq('org_id', membership.org_id)
        .single()

      if (fetchError || !entry) {
        setError('Changelog entry not found')
        setLoading(false)
        return
      }

      setTitle(entry.title || '')
      setContent(entry.content || '')
      setCategory(entry.category || 'feature')
      setIsPublished(entry.is_published || false)
      setLoading(false)
    }

    initialize()
  }, [params, supabase])

  const handleSubmit =
    (publish: boolean) => async (e: React.FormEvent | React.MouseEvent) => {
      e.preventDefault()
      if (!orgId || !id) return

      setSaving(true)
      setError('')

      try {
        const response = await fetch(`/api/changelog/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            content,
            category,
            is_published: publish,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          setError(errorData.error || 'Failed to save entry.')
          return
        }

        router.push('/changelog')
      } catch (err) {
        setError('Failed to save entry.')
      } finally {
        setSaving(false)
      }
    }

  const handleDelete = async () => {
    if (!id) return
    setDeleting(true)

    try {
      const response = await fetch(`/api/changelog/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        setError('Failed to delete entry.')
        return
      }

      router.push('/changelog')
    } catch (err) {
      setError('Failed to delete entry.')
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center py-12 text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Changelog Entry</h1>
          <p className="text-gray-600">Update your changelog entry</p>
        </div>

        <Card className="border-2 border-amber-200 shadow-lg bg-white">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200">
            <CardTitle className="text-xl text-gray-900">Entry Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(true)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-700 font-medium">
                  Title <span className="text-amber-600">*</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                  placeholder="Enter changelog title..."
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="border-amber-200 focus:border-amber-400">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feature">✨ Feature</SelectItem>
                    <SelectItem value="improvement">🚀 Improvement</SelectItem>
                    <SelectItem value="fix">🐛 Fix</SelectItem>
                    <SelectItem value="announcement">📢 Announcement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">
                  Content <span className="text-amber-600">*</span>
                </Label>
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  onPreview={(previewContent) => {
                    setShowPreview(true)
                  }}
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-amber-200">
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={saving || !title.trim() || !content.trim()}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    {saving ? 'Saving...' : isPublished ? 'Update' : 'Publish'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={saving}
                    onClick={handleSubmit(false)}
                    className="border-amber-200 hover:bg-amber-50"
                  >
                    Save Draft
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving}
                    onClick={() => router.push('/changelog')}
                    className="border-amber-200"
                  >
                    Cancel
                  </Button>
                  {!isPublished && (
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={saving || deleting}
                      onClick={() => setShowDeleteDialog(true)}
                      className="ml-2"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowPreview(true)}
                  disabled={!title.trim() || !content.trim()}
                  className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                >
                  Preview
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <ChangelogPreview
        title={title || 'Untitled'}
        content={content || '<p>No content yet</p>'}
        category={category}
        open={showPreview}
        onClose={() => setShowPreview(false)}
      />

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Changelog Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this changelog entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
