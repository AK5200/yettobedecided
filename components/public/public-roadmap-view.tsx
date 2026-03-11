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
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Map className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900">Roadmap is empty</p>
            <p className="text-sm text-gray-500 mt-1">Check back soon for updates</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {columns.map((column) => (
              <div key={column.key} className="flex flex-col">
                {/* Column header */}
                <div className="flex items-center gap-2.5 mb-4 px-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: column.dotColor }}
                  />
                  <h2 className="text-sm font-semibold text-gray-900">{column.label}</h2>
                  <span className="text-xs font-medium text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                    {column.posts.length}
                  </span>
                </div>

                {/* Column content */}
                <div className="space-y-2.5 flex-1">
                  {column.posts.length === 0 ? (
                    <div className="bg-white border border-dashed border-gray-200 rounded-xl py-8 text-center">
                      <p className="text-xs text-gray-400">No items</p>
                    </div>
                  ) : (
                    column.posts.map((post) => (
                      <PostDetailDialog key={post.id} post={post}>
                        <div className="group bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer">
                          <h3 className="text-[13px] font-semibold text-gray-900 leading-snug mb-2.5">
                            {post.title}
                          </h3>

                          {post.content && (
                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
                              {post.content}
                            </p>
                          )}

                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                              <ChevronUp className="h-3 w-3" />
                              {post.vote_count ?? 0}
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                              <MessageSquare className="h-3 w-3" />
                              {commentCountMap[post.id] || 0}
                            </span>
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
