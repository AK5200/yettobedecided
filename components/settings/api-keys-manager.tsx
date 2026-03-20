'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

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
  const { theme } = useTheme()
  const isDark = theme === 'dark'

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
      {/* Header with Create Button */}
      <div className="flex justify-end">
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => open ? setIsCreateDialogOpen(true) : handleCloseDialog()}>
          <DialogTrigger asChild>
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-kelo-yellow text-kelo-ink font-semibold text-sm hover:bg-kelo-yellow-dark transition-colors">
              {/* Plus icon */}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Create API Key
            </button>
          </DialogTrigger>
          <DialogContent className={`max-w-md rounded-2xl border ${isDark ? 'bg-[#111111] border-white/[0.07]' : 'bg-white border-kelo-border'}`}>
            <DialogHeader>
              <DialogTitle className={`font-display font-extrabold text-lg ${isDark ? 'text-white' : 'text-kelo-ink'}`}>
                {rawKey ? 'API Key Created' : 'Create New API Key'}
              </DialogTitle>
            </DialogHeader>

            {rawKey ? (
              <div className="space-y-4 pt-4">
                {/* Warning box in kelo-yellow tones */}
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-kelo-yellow/10 border-kelo-yellow/20' : 'bg-kelo-yellow/10 border-kelo-yellow/30'}`}>
                  <div className="flex items-start gap-3">
                    {/* Alert triangle icon */}
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 mt-0.5">
                      <path d="M8.57 3.22 1.5 15.5a1.67 1.67 0 0 0 1.43 2.5h14.14a1.67 1.67 0 0 0 1.43-2.5L11.43 3.22a1.67 1.67 0 0 0-2.86 0ZM10 7.5v3.33M10 14.17h.008" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-kelo-yellow-dark"/>
                    </svg>
                    <div>
                      <p className={`text-sm font-semibold ${isDark ? 'text-kelo-yellow' : 'text-kelo-ink'}`}>
                        Copy your API key now
                      </p>
                      <p className={`text-sm mt-1 ${isDark ? 'text-white/40' : 'text-kelo-muted'}`}>
                        This is the only time you&#39;ll be able to see this key. Store it securely.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-kelo-ink'}`}>
                    Your API Key
                  </span>
                  <div className="flex gap-2">
                    <code className={`flex-1 p-3 rounded-xl text-sm font-mono break-all ${isDark ? 'bg-white/[0.04] border border-white/[0.08] text-white' : 'bg-kelo-surface border border-kelo-border text-kelo-ink'}`}>
                      {rawKey}
                    </code>
                    <button
                      onClick={handleCopy}
                      className={`shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${isDark ? 'border-white/[0.08] hover:bg-white/[0.06] text-white' : 'border-kelo-border hover:bg-kelo-surface text-kelo-ink'}`}
                    >
                      {copied ? (
                        /* Check icon */
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3.5 8.5 6 11l6.5-6.5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        /* Copy icon */
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M10.5 5.5V3.5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleCloseDialog}
                    className="px-4 py-2.5 rounded-xl bg-kelo-yellow text-kelo-ink font-semibold text-sm hover:bg-kelo-yellow-dark transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label htmlFor="keyName" className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-kelo-ink'}`}>
                    Key Name
                  </label>
                  <input
                    id="keyName"
                    type="text"
                    placeholder="e.g., Production API Key"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-colors ${isDark ? 'bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:border-white/20' : 'bg-kelo-surface border border-kelo-border text-kelo-ink placeholder:text-kelo-muted focus:border-kelo-ink/30'}`}
                  />
                  <p className={`text-xs ${isDark ? 'text-white/40' : 'text-kelo-muted'}`}>
                    Give your key a descriptive name to remember its purpose.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    onClick={handleCloseDialog}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${isDark ? 'border-white/[0.08] text-white hover:bg-white/[0.06]' : 'border-kelo-border text-kelo-ink hover:bg-kelo-surface'}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={saving || !newKeyName.trim()}
                    className="px-4 py-2.5 rounded-xl bg-kelo-yellow text-kelo-ink font-semibold text-sm hover:bg-kelo-yellow-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Creating...' : 'Create Key'}
                  </button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* API Keys List */}
      <div className="space-y-3">
        {apiKeys.length === 0 ? (
          <div className={`rounded-2xl border p-10 text-center ${isDark ? 'bg-[#111111] border-white/[0.07]' : 'bg-white border-kelo-border'}`}>
            {/* Key icon - empty state */}
            <div className={`mx-auto mb-4 w-14 h-14 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/[0.04]' : 'bg-kelo-surface'}`}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78Zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={isDark ? 'text-white/20' : 'text-kelo-muted/40'}/>
              </svg>
            </div>
            <p className={`font-semibold ${isDark ? 'text-white' : 'text-kelo-ink'}`}>No API keys yet</p>
            <p className={`text-sm mt-1 ${isDark ? 'text-white/40' : 'text-kelo-muted'}`}>
              Create your first API key to access the API programmatically
            </p>
          </div>
        ) : (
          apiKeys.map((key) => (
            <div
              key={key.id}
              className={`rounded-2xl border p-4 ${isDark ? 'bg-[#111111] border-white/[0.07]' : 'bg-white border-kelo-border'}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Key icon with yellow accent */}
                  <div className="w-10 h-10 rounded-xl bg-kelo-yellow/15 flex items-center justify-center shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78Zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-kelo-yellow-dark"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-kelo-ink'}`}>{key.name}</h3>
                    <div className={`flex items-center gap-3 text-sm ${isDark ? 'text-white/40' : 'text-kelo-muted'}`}>
                      <code className={`px-2 py-0.5 rounded-md text-xs font-mono ${isDark ? 'bg-white/[0.04] text-white/60' : 'bg-kelo-surface text-kelo-ink/60'}`}>
                        {key.key_prefix}...
                      </code>
                      <span>Created {formatDate(key.created_at)}</span>
                      {key.last_used_at && (
                        <span>Last used {formatDate(key.last_used_at)}</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(key.id)}
                  className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  {/* Trash icon */}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.5 4.5h11M5.5 4.5V3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.5m1.5 0v8a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 4 12.5v-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6.5 7v4M9.5 7v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
