import { createAdminClient } from '@/lib/supabase/server';

export type UserSource = 'guest' | 'social_google' | 'social_github' | 'identified' | 'verified_jwt';

export interface WidgetUserInput {
  external_id?: string;
  email: string;
  name?: string;
  avatar_url?: string;
  user_source: UserSource;
  company_id?: string;
  company_name?: string;
  company_plan?: string;
  company_monthly_spend?: number;
}

export interface WidgetUser extends WidgetUserInput {
  id: string;
  org_id: string;
  post_count: number;
  vote_count: number;
  comment_count: number;
  is_banned: boolean;
}

// Priority for upgrading user source (higher = more trusted)
const SOURCE_PRIORITY: Record<UserSource, number> = {
  guest: 1,
  identified: 2,
  social_google: 3,
  social_github: 3,
  verified_jwt: 4,
};

/**
 * Find or create widget user, handling deduplication
 */
export async function upsertWidgetUser(
  orgId: string,
  data: WidgetUserInput
): Promise<{ user: WidgetUser | null; error: string | null }> {
  const client = createAdminClient();

  try {
    // Find by external_id first (if provided)
    if (data.external_id) {
      const { data: existing } = await client
        .from('widget_users')
        .select('*')
        .eq('org_id', orgId)
        .eq('external_id', data.external_id)
        .single();

      if (existing) {
        return updateExistingUser(client, existing, data);
      }
    }

    // Find by email
    const { data: existing } = await client
      .from('widget_users')
      .select('*')
      .eq('org_id', orgId)
      .ilike('email', data.email)
      .single();

    if (existing) {
      return updateExistingUser(client, existing, data);
    }

    // Create new user
    const { data: newUser, error } = await client
      .from('widget_users')
      .insert({ org_id: orgId, ...data })
      .select()
      .single();

    if (error) return { user: null, error: error.message };
    return { user: newUser, error: null };

  } catch (err: any) {
    return { user: null, error: err.message };
  }
}

async function updateExistingUser(
  client: any,
  existing: WidgetUser,
  data: WidgetUserInput
): Promise<{ user: WidgetUser | null; error: string | null }> {
  
  // Only upgrade source if new source is more trusted
  const shouldUpgrade = SOURCE_PRIORITY[data.user_source] > SOURCE_PRIORITY[existing.user_source as UserSource];

  const { data: updated, error } = await client
    .from('widget_users')
    .update({
      external_id: data.external_id || existing.external_id,
      name: data.name || existing.name,
      avatar_url: data.avatar_url || existing.avatar_url,
      user_source: shouldUpgrade ? data.user_source : existing.user_source,
      company_id: data.company_id || existing.company_id,
      company_name: data.company_name || existing.company_name,
      company_plan: data.company_plan || existing.company_plan,
      company_monthly_spend: data.company_monthly_spend ?? existing.company_monthly_spend,
      last_seen_at: new Date().toISOString(),
    })
    .eq('id', existing.id)
    .select()
    .single();

  if (error) return { user: null, error: error.message };
  return { user: updated, error: null };
}

/**
 * Increment engagement counter
 */
export async function incrementCounter(
  userId: string,
  counter: 'post_count' | 'vote_count' | 'comment_count'
): Promise<void> {
  const client = createAdminClient();
  
  const { data: user } = await client
    .from('widget_users')
    .select(counter)
    .eq('id', userId)
    .single();

  if (user) {
    const currentCount = (user as Record<string, number | null>)[counter] ?? 0
    await client
      .from('widget_users')
      .update({ 
        [counter]: currentCount + 1,
        last_seen_at: new Date().toISOString()
      })
      .eq('id', userId);
  }
}

/**
 * Ban/unban user
 */
export async function setUserBanned(
  userId: string,
  banned: boolean,
  reason?: string
): Promise<{ success: boolean; error: string | null }> {
  const client = createAdminClient();

  const { error } = await client
    .from('widget_users')
    .update({
      is_banned: banned,
      banned_at: banned ? new Date().toISOString() : null,
      banned_reason: banned ? reason : null,
    })
    .eq('id', userId);

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}
