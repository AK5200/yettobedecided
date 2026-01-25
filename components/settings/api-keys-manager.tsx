'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  last_used_at: string | null
  expires_at: string | null
  created_at: string
}

interface ApiKeysManagerProps {
  orgId: string
  initialApiKeys: ApiKey[]
}

export function ApiKeysManager({ orgId, initialApiKeys }: ApiKeysManagerProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialApiKeys)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [rawKey, setRawKey] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const response = await fetch('/api/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: orgId, name }),
    })
    if (!response.ok) {
      const errorData = await response.json()
      toast.error(errorData.error || 'Failed to create API key.')
    } else {
      const data = await response.json()
      setApiKeys((prev) => [data.apiKey, ...prev])
      setRawKey(data.rawKey)
      setName('')
      toast.success('API key created.')
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Delete this API key? This cannot be undone.')
    if (!confirmed) return
    const response = await fetch(`/api/api-keys/${id}`, { method: 'DELETE' })
    if (!response.ok) {
      const errorData = await response.json()
      toast.error(errorData.error || 'Failed to delete API key.')
      return
    }
    setApiKeys((prev) => prev.filter((key) => key.id !== id))
    toast.success('API key deleted.')
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleCreate} className="space-y-4 border rounded-lg p-6">
        <h2 className="text-lg font-semibold">Create API Key</h2>
        <div className="space-y-2">
          <Label htmlFor="api-key-name">Name</Label>
          <Input id="api-key-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create API Key'}
        </Button>
        {rawKey && (
          <div className="text-sm text-gray-600">
            <div className="font-medium text-black">New Key (copy now):</div>
            <code className="block mt-2 p-2 bg-gray-100 rounded">{rawKey}</code>
          </div>
        )}
      </form>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Existing API Keys</h2>
        {apiKeys.length === 0 ? (
          <p className="text-sm text-gray-600">No API keys created yet.</p>
        ) : (
          apiKeys.map((key) => (
            <div key={key.id} className="border rounded-lg p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-medium">{key.name}</div>
                <div className="text-sm text-gray-600">{key.key_prefix}</div>
              </div>
              <Button variant="destructive" onClick={() => handleDelete(key.id)}>
                Delete
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
