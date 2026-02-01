'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Plus,
  ExternalLink,
  Globe,
  Shield,
  Map,
  Megaphone,
  Users,
  BarChart3,
  Settings,
  Sparkles,
  LogOut,
  ChevronDown,
  ChevronRight,
  Building2,
  UserCog,
  LayoutGrid,
  Tags,
  Plug,
  Webhook,
  Key,
  MessageSquare,
} from 'lucide-react'

interface Organization {
  id: string
  name: string
  slug: string
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [org, setOrg] = useState<Organization | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    const fetchOrg = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: membership } = await supabase
        .from('org_members')
        .select('organizations(id, name, slug)')
        .eq('user_id', user.id)
        .single()

      if (membership?.organizations) {
        const orgData = membership.organizations as unknown as Organization
        setOrg(orgData)
      }
    }
    fetchOrg()
  }, [supabase])

  // Auto-expand settings when on a settings page
  useEffect(() => {
    if (pathname.startsWith('/settings')) {
      setSettingsOpen(true)
    }
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) => {
    if (href === '/feedback') {
      return pathname === '/feedback' || pathname.startsWith('/boards')
    }
    if (href === '/settings') {
      return pathname === '/settings'
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  const navItemClass = (href: string) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
      isActive(href)
        ? 'bg-amber-100 text-amber-900 font-medium'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`

  const subNavItemClass = (href: string) =>
    `flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors ${
      pathname === href
        ? 'bg-amber-50 text-amber-800 font-medium'
        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
    }`

  const settingsItems = [
    { href: '/settings/organization', label: 'Organization', icon: Building2 },
    { href: '/settings/team', label: 'Team', icon: UserCog },
    { href: '/settings/tags', label: 'Tags', icon: Tags },
    { href: '/settings/integrations', label: 'Integrations', icon: Plug },
    { href: '/settings/webhooks', label: 'Webhooks', icon: Webhook },
    { href: '/settings/api-keys', label: 'API Keys', icon: Key },
    { href: '/settings/sso', label: 'User Identification', icon: Shield },
  ]

  return (
    <div className="w-64 border-r bg-white h-screen flex flex-col sticky top-0">
      {/* Organization Header */}
      <div className="p-4 border-b shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white font-semibold text-sm">
              {org?.name?.charAt(0) || 'F'}
            </div>
            <span className="font-semibold text-gray-900 truncate max-w-[140px]">
              {org?.name || 'FeedbackHub'}
            </span>
          </div>
          {org?.slug && (
            <Link
              href={`/${org.slug}`}
              target="_blank"
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
              title="View public hub"
            >
              <ExternalLink className="h-4 w-4 text-gray-500" />
            </Link>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto subtle-scrollbar">
        {/* Create New Button */}
        <div className="p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={() => router.push('/feedback/new')}>
                <MessageSquare className="h-4 w-4 mr-2" />
                New Post
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/changelog/new')}>
                <Megaphone className="h-4 w-4 mr-2" />
                New Changelog
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/boards/new')}>
                <Plus className="h-4 w-4 mr-2" />
                New Board
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Quick Links */}
        <div className="px-4 space-y-1">
          <Link
            href={org?.slug ? `/${org.slug}` : '#'}
            target="_blank"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <Globe className="h-4 w-4" />
            Public hub
          </Link>
          <Link
            href="/moderation"
            className={navItemClass('/moderation')}
          >
            <Shield className="h-4 w-4" />
            Moderation
          </Link>
        </div>

        {/* Modules Section */}
        <div className="px-4 mt-6">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Modules
          </div>
          <nav className="space-y-1">
            <Link href="/feedback" className={navItemClass('/feedback')}>
              <LayoutGrid className="h-4 w-4" />
              Boards
            </Link>
            <Link href="/roadmap" className={navItemClass('/roadmap')}>
              <Map className="h-4 w-4" />
              Roadmap
            </Link>
            <Link href="/changelog" className={navItemClass('/changelog')}>
              <Megaphone className="h-4 w-4" />
              Changelog
            </Link>
          </nav>
        </div>

        {/* Insights Section */}
        <div className="px-4 mt-6">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Insights
          </div>
          <nav className="space-y-1">
            <Link href="/users" className={navItemClass('/users')}>
              <Users className="h-4 w-4" />
              Users
            </Link>
            <Link href="/prioritize" className={navItemClass('/prioritize')}>
              <BarChart3 className="h-4 w-4" />
              Prioritize
              <Badge className="ml-auto bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px] px-1.5 py-0">
                NEW
              </Badge>
            </Link>
          </nav>
        </div>

        {/* Workspace Section */}
        <div className="px-4 mt-6 pb-4">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Workspace
          </div>
          <nav className="space-y-1">
            {/* Collapsible Settings */}
            <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
              <CollapsibleTrigger className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors w-full">
                <Settings className="h-4 w-4" />
                <span className="flex-1 text-left">Settings</span>
                {settingsOpen ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 mt-1 space-y-0.5">
                {settingsItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={subNavItemClass(item.href)}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {item.label}
                    </Link>
                  )
                })}
              </CollapsibleContent>
            </Collapsible>

            <Link href="/widgets" className={navItemClass('/widgets')}>
              <Sparkles className="h-4 w-4" />
              Widgets
            </Link>
          </nav>
        </div>
      </div>

      {/* Bottom Links */}
      <div className="px-4 py-4 border-t space-y-1 shrink-0">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors w-full text-left"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  )
}
