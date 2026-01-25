'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function NewChangelogPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('feature')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orgId, setOrgId] = useState<string | null>(null)
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
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">New Changelog Entry</h1>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Entry details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(true)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feature">Feature</SelectItem>
                  <SelectItem value="improvement">Improvement</SelectItem>
                  <SelectItem value="fix">Fix</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Publish'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={loading}
                onClick={handleSubmit(false)}
              >
                Save Draft
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
