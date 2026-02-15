import { createAdminClient } from '@/lib/supabase/server'
import { LinearClient } from '@linear/sdk'

interface AutoSyncParams {
  postId: string
  orgId: string
  title: string
  content: string | null
  authorEmail: string | null
  guestEmail: string | null
}

/**
 * Auto-sync a post to Linear if the integration is connected and auto-sync is enabled.
 * This function is designed to be non-blocking - it will not throw errors or halt execution.
 * Any failures are logged but do not affect post creation.
 */
export async function autoSyncToLinear({
  postId,
  orgId,
  title,
  content,
  authorEmail,
  guestEmail,
}: AutoSyncParams): Promise<void> {
  try {
    const supabase = createAdminClient()

    // Get Linear integration for org
    const { data: linearIntegration, error: integrationError } = await supabase
      .from('linear_integrations')
      .select('*')
      .eq('org_id', orgId)
      .maybeSingle()

    // Exit silently if no integration or auto-sync is disabled
    if (!linearIntegration || !linearIntegration.auto_sync_enabled) {
      return
    }

    if (integrationError) {
      console.error('[autoSyncToLinear] Error fetching integration:', integrationError)
      return
    }

    // Check if post already synced (shouldn't happen, but safety check)
    const { data: post } = await supabase
      .from('posts')
      .select('linear_issue_id')
      .eq('id', postId)
      .single()

    if (post?.linear_issue_id) {
      console.log(`[autoSyncToLinear] Post ${postId} already synced, skipping`)
      return
    }

    // Create Linear client
    const linear = new LinearClient({ accessToken: linearIntegration.access_token })

    // Create Linear issue
    const author = authorEmail || guestEmail || 'Anonymous'
    const description = `**Source**: FeedbackHub\n**Author**: ${author}\n\n${content || ''}`

    const issueCreate = await linear.createIssue({
      teamId: linearIntegration.team_id!,
      title,
      description,
    })

    const issue = await issueCreate.issue

    if (issue) {
      // Update post with Linear info
      await supabase
        .from('posts')
        .update({
          linear_issue_id: issue.id,
          linear_issue_url: issue.url,
        })
        .eq('id', postId)

      console.log(`[autoSyncToLinear] Successfully synced post ${postId} to Linear: ${issue.url}`)
    } else {
      console.error('[autoSyncToLinear] Failed to create Linear issue - no issue returned')
    }
  } catch (error: any) {
    // Log error but don't throw - we don't want to block post creation
    console.error('[autoSyncToLinear] Auto-sync failed:', error.message || error)
  }
}
