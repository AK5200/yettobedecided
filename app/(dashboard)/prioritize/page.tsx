'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Filter,
  BarChart3,
  Trophy,
  Target,
  HelpCircle,
  XCircle,
  ChevronUp,
} from 'lucide-react'

interface Post {
  id: string
  title: string
  content: string
  status: string
  vote_count: number
  author_name: string | null
  created_at: string
  board_id: string
  boards?: { name: string; emoji?: string }
}

export default function PrioritizePage() {
  const router = useRouter()
  const supabase = createClient()

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (!membership) return

    const { data: boards } = await supabase
      .from('boards')
      .select('id')
      .eq('org_id', membership.org_id)
      .eq('is_archived', false)

    if (!boards || boards.length === 0) {
      setLoading(false)
      return
    }

    const { data: postsData } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        status,
        vote_count,
        author_name,
        created_at,
        board_id,
        boards(name, emoji)
      `)
      .in('board_id', boards.map((b: { id: string }) => b.id))
      .eq('is_approved', true)
      .order('vote_count', { ascending: false })

    setPosts((postsData || []) as unknown as Post[])
    setLoading(false)
  }

  const filteredPosts = posts.filter(
    (post) =>
      (filterStatus === 'all' || post.status === filterStatus) &&
      (post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content?.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="flex-1 bg-white">
      {/* Header */}
      <div className="border-b">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Prioritize</h1>
              <span className="text-gray-400">&gt;</span>
              <span className="font-semibold text-lg text-gray-900">Value vs Effort</span>
            </div>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search all posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-56"
                />
              </div>

              {/* Filter */}
              <Button variant="outline" size="sm" disabled title="Coming soon">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>

              {/* Chart Toggle */}
              <Button variant="outline" size="sm" disabled title="Coming soon">
                <BarChart3 className="h-4 w-4 mr-2" />
                Chart
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex h-[calc(100vh-140px)]">
        {/* Posts Sidebar */}
        <div className="w-80 border-r overflow-y-auto">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Posts</h2>
              <Badge variant="outline">{filterStatus === 'all' ? 'All' : filterStatus}</Badge>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No posts found</div>
          ) : (
            <div className="divide-y">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/boards/${post.board_id}?post=${post.id}`)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-1 text-gray-500 text-sm">
                      <ChevronUp className="h-3 w-3" />
                      <span>{post.vote_count}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {post.title}
                      </div>
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {post.content}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Matrix */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="h-full flex flex-col">
            {/* Y-axis label */}
            <div className="flex items-center h-full">
              <div className="flex flex-col items-center justify-center h-full -rotate-180 mr-4">
                <span className="text-xs font-semibold text-gray-400 tracking-widest [writing-mode:vertical-lr]">
                  VERY VALUABLE
                </span>
                <div className="flex-1 w-px bg-gray-200 my-4" />
                <span className="text-xs font-semibold text-gray-400 tracking-widest [writing-mode:vertical-lr]">
                  NOT VALUABLE
                </span>
              </div>

              {/* Grid */}
              <div className="flex-1 h-full grid grid-cols-2 grid-rows-2 gap-4">
                {/* Easy Wins - Top Left */}
                <div className="bg-emerald-100 rounded-2xl p-6 flex flex-col items-center justify-center relative">
                  <div className="w-20 h-20 rounded-full bg-emerald-200/50 flex items-center justify-center mb-3">
                    <Trophy className="h-10 w-10 text-emerald-500" />
                  </div>
                  <span className="font-semibold text-emerald-700 text-lg">Easy wins</span>
                  <div className="absolute top-2 right-2">
                    <div className="w-16 h-2 bg-emerald-200 rounded" />
                  </div>
                </div>

                {/* Big Bets - Top Right */}
                <div className="bg-blue-100 rounded-2xl p-6 flex flex-col items-center justify-center relative">
                  <div className="w-20 h-20 rounded-full bg-blue-200/50 flex items-center justify-center mb-3">
                    <Target className="h-10 w-10 text-blue-500" />
                  </div>
                  <span className="font-semibold text-blue-700 text-lg">Big bets</span>
                  <div className="absolute top-2 right-2">
                    <div className="w-16 h-2 bg-blue-200 rounded" />
                  </div>
                </div>

                {/* Maybes - Bottom Left */}
                <div className="bg-amber-100 rounded-2xl p-6 flex flex-col items-center justify-center relative">
                  <div className="w-20 h-20 rounded-full bg-amber-200/50 flex items-center justify-center mb-3">
                    <HelpCircle className="h-10 w-10 text-amber-500" />
                  </div>
                  <span className="font-semibold text-amber-700 text-lg">Maybes</span>
                </div>

                {/* Avoid - Bottom Right */}
                <div className="bg-pink-100 rounded-2xl p-6 flex flex-col items-center justify-center relative">
                  <div className="w-20 h-20 rounded-full bg-pink-200/50 flex items-center justify-center mb-3">
                    <XCircle className="h-10 w-10 text-pink-500" />
                  </div>
                  <span className="font-semibold text-pink-700 text-lg">Avoid</span>
                </div>
              </div>
            </div>

            {/* X-axis label */}
            <div className="flex items-center justify-center mt-4 pt-4">
              <span className="text-xs font-semibold text-gray-400 tracking-widest">EASY TO ADD</span>
              <div className="flex-1 h-px bg-gray-200 mx-4 max-w-md" />
              <span className="text-xs font-semibold text-gray-400 tracking-widest">DIFFICULT TO ADD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
