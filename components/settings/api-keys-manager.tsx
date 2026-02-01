'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Key, Trash2, Copy, Check, AlertTriangle } from 'lucide-react'

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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [rawKey, setRawKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCreate = async () => {
    if (!newKeyName.trim()) return
    setSaving(true)

    const response = await fetch('/api/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: orgId, name: newKeyName }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      toast.error(errorData.error || 'Failed to create API key')
    } else {
      const data = await response.json()
      setApiKeys((prev) => [data.apiKey, ...prev])
      setRawKey(data.rawKey)
      setNewKeyName('')
      toast.success('API key created!')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key? This cannot be undone.')) return

    const response = await fetch(`/api/api-keys/${id}`, { method: 'DELETE' })
    if (!response.ok) {
      const errorData = await response.json()
      toast.error(errorData.error || 'Failed to delete API key')
      return
    }
    setApiKeys((prev) => prev.filter((key) => key.id !== id))
    toast.success('API key deleted!')
  }

  const handleCopy = async () => {
    if (rawKey) {
      await navigator.clipboard.writeText(rawKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Copied to clipboard!')
    }
  }

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false)
    setRawKey(null)
    setNewKeyName('')
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Add API Key Button */}
      <div className="flex justify-end">
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => open ? setIsCreateDialogOpen(true) : handleCloseDialog()}>
          <DialogTrigger asChild>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{rawKey ? 'API Key Created' : 'Create New API Key'}</DialogTitle>
            </DialogHeader>

            {rawKey ? (
              <div className="space-y-4 pt-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        Copy your API key now
                      </p>
                      <p className="text-sm text-amber-700 mt-1">
                        This is the only time you'll be able to see this key. Store it securely.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Your API Key</Label>
                  <div className="flex gap-2">
                    <code className="flex-1 p-3 bg-gray-100 rounded-lg text-sm font-mono break-all">
                      {rawKey}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopy}
                      className="shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleCloseDialog} className="bg-amber-500 hover:bg-amber-600 text-white">
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="keyName">Key Name</Label>
                  <Input
                    id="keyName"
                    placeholder="e.g., Production API Key"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Give your key a descriptive name to remember its purpose.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={saving || !newKeyName.trim()}
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    {saving ? 'Creating...' : 'Create Key'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* API Keys List */}
      <div className="space-y-3">
        {apiKeys.length === 0 ? (
          <Card className="p-8 text-center">
            <Key className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No API keys yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Create your first API key to access the API programmatically
            </p>
          </Card>
        ) : (
          apiKeys.map((key) => (
            <Card key={key.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <Key className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-gray-900">{key.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                        {key.key_prefix}...
                      </code>
                      <span>Created {formatDate(key.created_at)}</span>
                      {key.last_used_at && (
                        <span>Last used {formatDate(key.last_used_at)}</span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(key.id)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
