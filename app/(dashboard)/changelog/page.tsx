'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Search,
  Users,
  Plus,
  Megaphone,
  Edit,
  CheckCircle,
  Flag,
  Trash2,
} from 'lucide-react'

interface ChangelogEntry {
  id: string
  title: string
  content: string
  category: string
  is_published: boolean
  published_at: string | null
  created_at: string
  image_url?: string
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  feature: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: Plus },
  improvement: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle },
  fix: { bg: 'bg-orange-100', text: 'text-orange-700', icon: Flag },
  announcement: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Megaphone },
}

export default function ChangelogPage() {
  const router = useRouter()
  const supabase = createClient()

  const [entries, setEntries] = useState<ChangelogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'published' | 'drafts'>('published')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data: membership, error: membershipError } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (membershipError || !membership) {
      console.error('Failed to fetch organization membership:', membershipError)
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('changelog_entries')
      .select('*')
      .eq('org_id', membership.org_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch changelog entries:', error)
    }

    setEntries(data || [])
    setLoading(false)
  }

  const publishedEntries = entries.filter((e) => e.is_published)
  const draftEntries = entries.filter((e) => !e.is_published)

  const filteredPublished = publishedEntries.filter(
    (e) =>
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.content?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredDrafts = draftEntries.filter(
    (e) =>
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.content?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const EmptyState = () => (
    <div className="rounded-2xl bg-gradient-to-br from-purple-100 via-pink-50 to-amber-50 p-8 md:p-12">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Create a Changelog
          </h2>
          <p className="text-gray-600 mb-6 max-w-md">
            Create your first Changelog to quickly announce new product updates,
            build feature awareness, and engage customers with your newest
            releases.
          </p>
          <Button
            onClick={() => router.push('/changelog/new')}
            className="bg-gray-900 hover:bg-gray-800"
          >
            Create Changelog
          </Button>
        </div>
        <div className="flex-shrink-0">
          <div className="w-48 h-32 relative">
            {/* Decorative cards */}
            <div className="absolute top-0 left-0 w-full h-8 bg-white rounded-lg shadow-sm border flex items-center gap-2 px-3">
              <CheckCircle className="h-3 w-3 text-emerald-500" />
              <div className="flex-1 h-2 bg-gray-100 rounded" />
            </div>
            <div className="absolute top-10 left-4 w-full h-10 bg-white rounded-lg shadow-md border flex items-center gap-2 px-3">
              <Flag className="h-4 w-4 text-amber-500" />
              <div className="flex-1">
                <div className="h-2 bg-amber-100 rounded w-12 mb-1" />
                <div className="h-1.5 bg-gray-100 rounded w-20" />
              </div>
            </div>
            <div className="absolute top-24 left-0 w-full h-8 bg-white rounded-lg shadow-sm border flex items-center gap-2 px-3">
              <CheckCircle className="h-3 w-3 text-gray-300" />
              <div className="flex-1 h-2 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this changelog entry? This action cannot be undone.')) {
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch(`/api/changelog/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        alert('Failed to delete entry.')
        return
      }

      setEntries(entries.filter((e) => e.id !== id))
    } catch (err) {
      alert('Failed to delete entry.')
    } finally {
      setDeletingId(null)
    }
  }

  const EntryCard = ({ entry }: { entry: ChangelogEntry }) => {
    const style = CATEGORY_STYLES[entry.category] || CATEGORY_STYLES.announcement
    const Icon = style.icon
    const isDraft = !entry.is_published

    return (
      <div
        onClick={() => router.push(`/changelog/${entry.id}/edit`)}
        className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border-b last:border-b-0"
      >
        <div className={`w-10 h-10 rounded-lg ${style.bg} flex items-center justify-center shrink-0`}>
          <Icon className={`h-5 w-5 ${style.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-900 truncate">{entry.title}</h3>
            <Badge className={`${style.bg} ${style.text} border-0 text-[10px] capitalize`}>
              {entry.category}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 line-clamp-2">
            {entry.content?.replace(/<[^>]*>/g, '') || 'No content'}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-gray-400">
              {entry.published_at
                ? new Date(entry.published_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Not published'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/changelog/${entry.id}/edit`)
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          {isDraft && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleDelete(entry.id, e)}
              disabled={deletingId === entry.id}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-white">
      {/* Header */}
      <div className="border-b">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Changelog</h1>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search changelogs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-56"
                />
              </div>

              {/* Manage Subscribers */}
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Manage Subscribers
              </Button>

              {/* Add Changelog */}
              <Button
                onClick={() => router.push('/changelog/new')}
                className="bg-gray-900 hover:bg-gray-800"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Changelog
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-8">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'published' | 'drafts')}>
            <TabsList className="bg-transparent h-auto p-0 gap-0">
              <TabsTrigger
                value="published"
                className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-gray-600 data-[state=active]:text-gray-900"
              >
                <span className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4" />
                  Published
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="drafts"
                className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-gray-600 data-[state=active]:text-gray-900"
              >
                <span className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Drafts
                  {draftEntries.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {draftEntries.length}
                    </Badge>
                  )}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : activeTab === 'published' ? (
          filteredPublished.length === 0 ? (
            publishedEntries.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="text-center py-12 text-gray-500">
                No changelogs match your search
              </div>
            )
          ) : (
            <div className="bg-white rounded-lg border">
              {filteredPublished.map((entry) => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          )
        ) : filteredDrafts.length === 0 ? (
          <div className="text-center py-12">
            <Edit className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No drafts yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Drafts will appear here before you publish them
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border">
            {filteredDrafts.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
