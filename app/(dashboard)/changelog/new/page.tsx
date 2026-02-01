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

export default function NewChangelogPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('feature')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orgId, setOrgId] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchOrgId = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      setOrgId(data?.org_id ?? null)
    }

    fetchOrgId()
  }, [supabase])

  const handleSubmit =
    (publish: boolean) => async (e: React.FormEvent | React.MouseEvent) => {
      e.preventDefault()
      if (!orgId) return

      setLoading(true)
      setError('')

      try {
        const response = await fetch('/api/changelog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            org_id: orgId,
            title,
            content,
            category,
            is_published: publish,
          }),
        })

        if (!response.ok) {
          setError('Failed to save entry.')
          return
        }

        router.push('/changelog')
      } catch (err) {
        setError('Failed to save entry.')
      } finally {
        setLoading(false)
      }
    }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Changelog</h1>
          <p className="text-gray-600">Share updates, features, and improvements with your users</p>
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
                    disabled={loading || !title.trim() || !content.trim()}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    {loading ? 'Publishing...' : 'Publish'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={loading}
                    onClick={handleSubmit(false)}
                    className="border-amber-200 hover:bg-amber-50"
                  >
                    Save Draft
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading}
                    onClick={() => router.push('/changelog')}
                    className="border-amber-200"
                  >
                    Cancel
                  </Button>
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
    </div>
  )
}
