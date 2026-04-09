'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
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
  Menu,
  X,
  Check,
} from 'lucide-react'
import { ORG_COOKIE_NAME } from '@/lib/org-constants'

interface Organization {
  id: string
  name: string
  slug: string
  onboarding_completed?: boolean
  logo_url?: string | null
}

interface OrgMembership {
  org_id: string
  role: string
  organizations: Organization
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [org, setOrg] = useState<Organization | null>(null)
  const [allOrgs, setAllOrgs] = useState<OrgMembership[]>([])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [orgSwitcherOpen, setOrgSwitcherOpen] = useState(false)
  const [createOrgOpen, setCreateOrgOpen] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')
  const [pendingModerationCount, setPendingModerationCount] = useState(0)

  useEffect(() => {
    const fetchOrgs = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: memberships, error } = await supabase
        .from('org_members')
        .select('org_id, role, organizations(id, name, slug, onboarding_completed, logo_url)')
        .eq('user_id', user.id)

      if (error || !memberships || memberships.length === 0) return

      setAllOrgs(memberships as unknown as OrgMembership[])

      // Determine current org from cookie
      const savedOrgId = document.cookie
        .split('; ')
        .find(c => c.startsWith(ORG_COOKIE_NAME + '='))
        ?.split('=')[1]

      const currentMembership = savedOrgId
        ? memberships.find((m: any) => m.org_id === savedOrgId)
        : null

      const active = currentMembership || memberships[0]
      const orgData = (active as any).organizations as Organization
      setOrg(orgData)

      // If no cookie was set or it was invalid, set it now
      if (!currentMembership) {
        document.cookie = `${ORG_COOKIE_NAME}=${orgData.id}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
      }
    }
    fetchOrgs()
  }, [supabase])

  // Fetch pending moderation count
  useEffect(() => {
    if (!org?.id) return
    const fetchPendingCount = async () => {
      const { data: boards } = await supabase
        .from('boards')
        .select('id')
        .eq('org_id', org.id)
      if (!boards || boards.length === 0) return

      const boardIds = boards.map((b: { id: string }) => b.id)
      const { count: postCount } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('is_approved', false)
        .in('board_id', boardIds)

      const { data: postIds } = await supabase
        .from('posts')
        .select('id')
        .in('board_id', boardIds)

      let commentCount = 0
      if (postIds && postIds.length > 0) {
        const { count } = await supabase
          .from('comments')
          .select('id', { count: 'exact', head: true })
          .eq('is_approved', false)
          .in('post_id', postIds.map((p: { id: string }) => p.id))
        commentCount = count || 0
      }

      setPendingModerationCount((postCount || 0) + commentCount)
    }
    fetchPendingCount()
    // Poll every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000)
    // Listen for instant updates from moderation page
    let bc: BroadcastChannel | null = null
    try {
      bc = new BroadcastChannel('kelo_moderation')
      bc.onmessage = () => fetchPendingCount()
    } catch {}
    return () => {
      clearInterval(interval)
      bc?.close()
    }
  }, [org?.id, supabase])

  // Auto-expand settings when on a settings page
  useEffect(() => {
    if (pathname.startsWith('/settings')) {
      setSettingsOpen(true)
    }
  }, [pathname])

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleSwitchOrg = async (targetOrgId: string) => {
    if (targetOrgId === org?.id) {
      setOrgSwitcherOpen(false)
      return
    }

    try {
      const res = await fetch('/api/organizations/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: targetOrgId }),
      })

      if (res.ok) {
        setOrgSwitcherOpen(false)
        // Full page reload so all server components re-fetch with new org cookie
        window.location.href = window.location.pathname
      }
    } catch (e) {
      console.error('Failed to switch org:', e)
    }
  }

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newOrgName.trim()) return

    setCreateLoading(true)
    setCreateError('')

    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newOrgName.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setCreateError(data.error || 'Failed to create organization')
        setCreateLoading(false)
        return
      }

      // Switch to the new org
      await fetch('/api/organizations/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: data.organization.id }),
      })

      setCreateOrgOpen(false)
      setNewOrgName('')
      setCreateLoading(false)

      // Full page reload so all server components re-fetch with new org cookie
      window.location.href = window.location.pathname
    } catch {
      setCreateError('Something went wrong')
      setCreateLoading(false)
    }
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
        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
    }`

  const subNavItemClass = (href: string) =>
    `flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors ${
      pathname === href
        ? 'bg-amber-50 text-amber-800 font-medium'
        : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground/80'
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

  const sidebarContent = (
    <>
      {/* Organization Header — clickable to open org switcher */}
      <div className="p-4 border-b border-sidebar-border shrink-0">
        <div className="flex items-center justify-between">
          <DropdownMenu open={orgSwitcherOpen} onOpenChange={setOrgSwitcherOpen}>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 hover:bg-sidebar-accent rounded-lg px-1.5 py-1 -ml-1.5 transition-colors min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                  {org?.name?.charAt(0) || 'K'}
                </div>
                <span className="font-semibold text-sidebar-foreground truncate max-w-[120px]">
                  {org?.name || 'Kelo'}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/40 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" sideOffset={8} className="w-64">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Organizations
              </div>
              {allOrgs.map((membership) => {
                const mOrg = membership.organizations
                const isCurrent = mOrg.id === org?.id
                return (
                  <DropdownMenuItem
                    key={mOrg.id}
                    onClick={() => handleSwitchOrg(mOrg.id)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-md bg-amber-500 flex items-center justify-center text-white font-semibold text-xs shrink-0">
                      {mOrg.name?.charAt(0) || 'K'}
                    </div>
                    <span className="flex-1 truncate">{mOrg.name}</span>
                    {isCurrent && <Check className="h-4 w-4 text-amber-600 shrink-0" />}
                  </DropdownMenuItem>
                )
              })}
              {allOrgs.some((m) => m.role === 'owner') && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setOrgSwitcherOpen(false)
                      setCreateOrgOpen(true)
                    }}
                    className="cursor-pointer"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create new organization
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex items-center gap-1">
            {org?.slug && (
              <Link
                href={`/${org.slug}/features`}
                target="_blank"
                className="p-1.5 hover:bg-sidebar-accent rounded-md transition-colors"
                title="View public hub"
              >
                <ExternalLink className="h-4 w-4 text-sidebar-foreground/60" />
              </Link>
            )}
            {/* Close button for mobile */}
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 hover:bg-sidebar-accent rounded-md transition-colors md:hidden"
            >
              <X className="h-4 w-4 text-sidebar-foreground/60" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto subtle-scrollbar">
        {/* Setup Guide — shown until onboarding is complete */}
        {org && org.onboarding_completed === false && (
          <div className="px-4 pt-4 pb-2">
            <Link
              href="/onboarding"
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                pathname === '/onboarding'
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="flex-1">Setup Guide</span>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </span>
            </Link>
          </div>
        )}

        {/* Create New Button */}
        <div className={`p-4 ${org && org.onboarding_completed === false ? 'pt-0' : ''}`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
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
                <LayoutGrid className="h-4 w-4 mr-2" />
                New Board
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCreateOrgOpen(true)}>
                <Building2 className="h-4 w-4 mr-2" />
                New Organization
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Quick Links */}
        <div className="px-4 space-y-1">
          <Link
            href={org?.slug ? `/${org.slug}/features` : '#'}
            target="_blank"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <Globe className="h-4 w-4" />
            Public hub
          </Link>
          <Link
            href="/moderation"
            className={navItemClass('/moderation')}
          >
            <Shield className="h-4 w-4" />
            <span className="flex-1">Moderation</span>
            {pendingModerationCount > 0 && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </span>
            )}
          </Link>
        </div>

        {/* Modules Section */}
        <div className="px-4 mt-6">
          <div className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-3 mb-2">
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
          <div className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-3 mb-2">
            Insights
          </div>
          <nav className="space-y-1">
            <Link href="/users" className={navItemClass('/users')}>
              <Users className="h-4 w-4" />
              Users
            </Link>
            <Link href="/analytics" className={navItemClass('/analytics')}>
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Link>
          </nav>
        </div>

        {/* Workspace Section */}
        <div className="px-4 mt-6 pb-4">
          <div className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-3 mb-2">
            Workspace
          </div>
          <nav className="space-y-1">
            {/* Collapsible Settings */}
            <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
              <CollapsibleTrigger className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors w-full">
                <Settings className="h-4 w-4" />
                <span className="flex-1 text-left">Settings</span>
                {settingsOpen ? (
                  <ChevronDown className="h-4 w-4 text-sidebar-foreground/40" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-sidebar-foreground/40" />
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
      <div className="px-4 py-4 border-t border-sidebar-border space-y-1 shrink-0">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors w-full text-left"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-30 md:hidden bg-background border-b h-14 px-4 flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
        >
          <Menu className="h-5 w-5 text-foreground/80" />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-white font-semibold text-xs shrink-0">
            {org?.name?.charAt(0) || 'K'}
          </div>
          <span className="font-semibold text-foreground truncate">
            {org?.name || 'Kelo'}
          </span>
        </div>
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col md:hidden">
          {sidebarContent}
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex w-64 border-r border-sidebar-border bg-sidebar h-screen flex-col sticky top-0">
        {sidebarContent}
      </div>

      {/* Create Organization Dialog */}
      <Dialog open={createOrgOpen} onOpenChange={setCreateOrgOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create new organization</DialogTitle>
            <DialogDescription>
              Create a separate organization for another product or team.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateOrg}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization name</Label>
                <Input
                  id="org-name"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="e.g. Acme Inc."
                  autoFocus
                  disabled={createLoading}
                />
              </div>
              {createError && (
                <p className="text-sm text-destructive">{createError}</p>
              )}
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOrgOpen(false)}
                disabled={createLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createLoading || !newOrgName.trim()}>
                {createLoading ? 'Creating...' : 'Create organization'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
