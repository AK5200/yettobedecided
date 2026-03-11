'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Organization } from '@/lib/types/database'

interface PublicHubNavProps {
  org: Organization
  orgSlug: string
}

export function PublicHubNav({ org, orgSlug }: PublicHubNavProps) {
  const pathname = usePathname()

  const links = [
    { href: `/${orgSlug}/features`, label: 'Features' },
    { href: `/${orgSlug}/roadmap`, label: 'Roadmap' },
    { href: `/${orgSlug}/changelog`, label: 'Changelog' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          {/* Org branding */}
          <div className="flex items-center gap-2.5">
            {org.logo_url ? (
              <img
                src={org.logo_url}
                alt={org.name}
                className="h-7 w-7 rounded-lg object-cover"
              />
            ) : (
              <div className="h-7 w-7 rounded-lg bg-linear-to-br from-yellow-400 to-yellow-500 flex items-center justify-center shadow-sm">
                <span className="text-xs font-bold text-gray-900">
                  {org.name?.charAt(0)?.toUpperCase() || 'K'}
                </span>
              </div>
            )}
            <span className="text-sm font-semibold text-gray-900 tracking-tight">
              {org.name}
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {links.map((link) => {
              const isActive = pathname === link.href || pathname?.startsWith(link.href + '/')
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-[-13px] left-3 right-3 h-[2px] bg-yellow-400 rounded-full" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Spacer for alignment */}
          <div className="w-[120px]" />
        </div>
      </div>
    </header>
  )
}
