import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const sampleEntries = [
  {
    title: 'Dark Mode Support',
    content: `We've added a beautiful dark mode to reduce eye strain during late-night work sessions. Toggle between light and dark themes in your settings, or let it follow your system preference automatically.`,
    category: 'feature',
  },
  {
    title: 'Performance Improvements',
    content: `We've optimized our backend infrastructure for faster load times. Pages now load 40% faster with improved caching and optimized database queries.`,
    category: 'improvement',
  },
  {
    title: 'Fixed Export Bug',
    content: `Resolved an issue where CSV exports would sometimes fail for large datasets. The export feature now handles datasets of any size reliably.`,
    category: 'fix',
  },
  {
    title: 'Introducing Team Workspaces',
    content: `Big announcement! You can now create team workspaces to collaborate with your colleagues. Invite team members, assign roles, and work together seamlessly.`,
    category: 'feature',
  },
]

export async function POST() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's org
    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    // Insert sample entries with staggered published_at dates
    const now = new Date()
    const entries = sampleEntries.map((entry, index) => ({
      org_id: membership.org_id,
      title: entry.title,
      content: entry.content,
      category: entry.category,
      is_published: true,
      published_at: new Date(now.getTime() - index * 24 * 60 * 60 * 1000).toISOString(), // Each entry 1 day apart
    }))

    const { data, error } = await supabase
      .from('changelog_entries')
      .insert(entries)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Sample changelog entries created', entries: data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
