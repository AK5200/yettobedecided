'use client'

import { PostDetailDialog } from '@/components/boards/post-detail-dialog'
import { PublicHubNav } from '@/components/public/public-hub-nav'
import { ChevronUp, MessageSquare, Map } from 'lucide-react'
import type { Post, Organization } from '@/lib/types/database'

interface RoadmapColumn {
  key: string
  label: string
  color: string
  dotColor: string
  posts: Post[]
}

interface PublicRoadmapViewProps {
  org: Organization
  orgSlug: string
  columns: RoadmapColumn[]
  commentCountMap: Record<string, number>
}

export function PublicRoadmapView({
  org,
  orgSlug,
  columns,
  commentCountMap,
}: PublicRoadmapViewProps) {
  const totalPosts = columns.reduce((sum, col) => sum + col.posts.length, 0)

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <PublicHubNav org={org} orgSlug={orgSlug} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Roadmap</h1>
          <p className="text-sm text-gray-500 mt-1">
            See what we&apos;re working on and what&apos;s coming next
          </p>
        </div>

        {totalPosts === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center mx-auto mb-4">
              <Map className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-sm font-medium text-gray-900">Roadmap is empty</p>
            <p className="text-sm text-gray-500 mt-1">Check back soon for updates</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {columns.map((column) => (
              <div key={column.key} className="flex flex-col">
                {/* Column header */}
                <div
                  className="flex items-center gap-2.5 mb-4 px-3 py-2 rounded-lg"
                  style={{ backgroundColor: column.dotColor + '10' }}
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: column.dotColor }}
                  />
                  <h2 className="text-sm font-semibold text-gray-900">{column.label}</h2>
                  <span
                    className="text-[11px] font-semibold rounded-full px-2 py-0.5 ml-auto"
                    style={{ backgroundColor: column.dotColor + '18', color: column.dotColor }}
                  >
                    {column.posts.length}
                  </span>
                </div>

                {/* Column content */}
                <div className="space-y-3 flex-1">
                  {column.posts.length === 0 ? (
                    <div className="bg-white border border-dashed border-gray-200 rounded-xl py-8 text-center">
                      <p className="text-xs text-gray-400">No items</p>
                    </div>
                  ) : (
                    column.posts.map((post) => (
                      <PostDetailDialog key={post.id} post={post}>
                        <div className="group bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-yellow-300/50 transition-all cursor-pointer">
                          <h3 className="text-sm font-bold text-gray-900 mb-2 group-hover:text-yellow-600 transition-colors">
                            {post.title}
                          </h3>

                          {post.content && (
                            <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">
                              {post.content}
                            </p>
                          )}

                          {!post.content && <div className="mb-4" />}

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-gray-400 group-hover:text-yellow-500 transition-colors">
                              <ChevronUp className="h-4 w-4" />
                              <span className="text-[11px] font-bold">{post.vote_count ?? 0}</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-400">
                              <MessageSquare className="h-4 w-4" />
                              <span className="text-[11px] font-bold">{commentCountMap[post.id] || 0}</span>
                            </div>
                          </div>
                        </div>
                      </PostDetailDialog>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Branding footer */}
        {org.show_branding && (
          <div className="mt-16 pb-8 text-center">
            <span className="text-xs text-gray-400">
              Powered by{' '}
              <a
                href="https://kelohq.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                Kelo
              </a>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
