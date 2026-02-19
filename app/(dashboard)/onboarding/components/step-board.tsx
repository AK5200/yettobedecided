'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LayoutGrid, ArrowRight, ArrowLeft, Loader2, MessageSquare, Bug, Lightbulb } from 'lucide-react'
import { toast } from 'sonner'

const SUGGESTIONS = [
  { name: 'Feature Requests', desc: 'Collect ideas for new features', icon: Lightbulb, color: 'text-amber-500' },
  { name: 'Bug Reports', desc: 'Track bugs reported by users', icon: Bug, color: 'text-red-500' },
  { name: 'General Feedback', desc: 'Open-ended feedback from users', icon: MessageSquare, color: 'text-blue-500' },
]

interface StepBoardProps {
  orgId: string
  onComplete: () => void
  onBack: () => void
}

export function StepBoard({ orgId, onComplete, onBack }: StepBoardProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSuggestion = (suggestion: { name: string; desc: string }) => {
    setName(suggestion.name)
    setDescription(suggestion.desc)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          name: name.trim(),
          description: description.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to create board')
        setLoading(false)
        return
      }

      toast.success('Board created!')
      onComplete()
    } catch {
      toast.error('Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center mx-auto mb-4">
          <LayoutGrid className="h-6 w-6 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Create your first board</h2>
        <p className="text-sm text-gray-400 mt-1.5">
          Boards organize feedback by topic. Pick a template or create your own.
        </p>
      </div>

      {/* Quick Suggestions */}
      <div className="grid grid-cols-3 gap-2">
        {SUGGESTIONS.map((s) => {
          const Icon = s.icon
          const selected = name === s.name
          return (
            <button
              key={s.name}
              type="button"
              onClick={() => handleSuggestion(s)}
              className={`
                flex flex-col items-center gap-1.5 p-3 rounded-xl text-center transition-all border
                ${selected
                  ? 'bg-amber-50/50 border-amber-200 shadow-sm'
                  : 'bg-gray-50/50 border-gray-100 hover:border-gray-200 hover:bg-white'
                }
              `}
            >
              <Icon className={`h-4 w-4 ${selected ? 'text-amber-500' : s.color}`} />
              <span className={`text-xs font-medium leading-tight ${selected ? 'text-amber-700' : 'text-gray-600'}`}>
                {s.name}
              </span>
            </button>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="board-name" className="text-sm font-medium text-gray-600">
            Board name
          </Label>
          <Input
            id="board-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Feature Requests"
            className="h-11"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="board-desc" className="text-sm font-medium text-gray-600">
            Description <span className="text-gray-300 font-normal">(optional)</span>
          </Label>
          <Textarea
            id="board-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What kind of feedback should go here?"
            rows={2}
            className="text-sm"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="h-11 px-5 rounded-xl text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            type="submit"
            disabled={loading || !name.trim()}
            className="flex-1 h-11 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
        <div className="text-center">
          <button
            type="button"
            onClick={onComplete}
            className="text-xs text-gray-300 hover:text-gray-500 transition-colors"
          >
            Skip this step
          </button>
        </div>
      </form>
    </div>
  )
}
