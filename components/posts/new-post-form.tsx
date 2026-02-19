'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface NewPostFormProps {
  boardId: string
}

export function NewPostForm({ boardId }: NewPostFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, board_id: boardId })
      })

      if (res.ok) {
        router.push(`/boards/${boardId}`)
        router.refresh()
      } else {
        const data = await res.json().catch(() => null)
        toast.error(data?.error || 'Failed to create post. Please try again.')
      }
    } catch (err) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4 max-w-xl'>
      <div>
        <Label htmlFor='title'>Title</Label>
        <Input
          id='title'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='Feature title'
          required
          maxLength={200}
        />
      </div>
      <div>
        <Label htmlFor='description'>Description</Label>
        <Textarea
          id='description'
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder='Describe the feature...'
          rows={5}
        />
      </div>
      <div className='flex gap-2'>
        <Button type='submit' disabled={loading}>
          {loading ? 'Creating...' : 'Create Post'}
        </Button>
        <Button type='button' variant='outline' onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
