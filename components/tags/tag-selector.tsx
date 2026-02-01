'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'

interface Tag {
  id: string
  name: string
  color: string
}

interface TagSelectorProps {
  postId: string
  orgId: string
}

export function TagSelector({ postId, orgId }: TagSelectorProps) {
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [postTags, setPostTags] = useState<Tag[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Fetch all org tags
    fetch(`/api/tags?org_id=${orgId}`)
      .then(res => res.json())
      .then(data => setAllTags(data.tags || []))

    // Fetch tags for this post
    fetch(`/api/posts/${postId}/tags`)
      .then(res => res.json())
      .then(data => setPostTags(data.tags || []))
  }, [postId, orgId])

  const addTag = async (tag: Tag) => {
    await fetch(`/api/posts/${postId}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag_id: tag.id })
    })
    setPostTags([...postTags, tag])
  }

  const removeTag = async (tagId: string) => {
    await fetch(`/api/posts/${postId}/tags?tag_id=${tagId}`, {
      method: 'DELETE'
    })
    setPostTags(postTags.filter(t => t.id !== tagId))
  }

  const availableTags = allTags.filter(t => !postTags.find(pt => pt.id === t.id))

  return (
    <div className="flex flex-wrap items-center gap-2">
      {postTags.map(tag => (
        <span
          key={tag.id}
          style={{ backgroundColor: tag.color, color: '#fff' }}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          {tag.name}
          <button
            type="button"
            className="ml-0.5 hover:opacity-70 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              removeTag(tag.id)
            }}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          className="h-6"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            setOpen(!open)
          }}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Tag
        </Button>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <div className="absolute left-0 top-full mt-1 z-50 w-48 rounded-md border bg-background p-2 shadow-md">
              {availableTags.length === 0 ? (
                <p className="text-sm text-gray-500">No more tags</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {availableTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => { addTag(tag); setOpen(false) }}
                      className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded text-left"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
