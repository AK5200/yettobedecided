export interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  plan: 'free' | 'pro' | 'team'
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  custom_domain: string | null
  show_branding: boolean
  created_at: string
  updated_at: string
}

export interface OrgMember {
  id: string
  org_id: string
  user_id: string
  role: 'owner' | 'admin'
  created_at: string
}

export interface Board {
  id: string
  org_id: string
  name: string
  slug: string
  description: string | null
  is_public: boolean
  require_approval: boolean
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  board_id: string
  title: string
  content: string | null
  status: 'open' | 'planned' | 'in_progress' | 'shipped' | 'closed'
  author_email: string | null
  author_name: string | null
  is_guest: boolean
  guest_name: string | null
  guest_email: string | null
  linear_issue_id: string | null
  linear_issue_url: string | null
  is_approved: boolean
  is_pinned: boolean
  admin_note: string | null
  vote_count: number
  created_at: string
  updated_at: string
}

export interface Vote {
  id: string
  post_id: string
  voter_email: string
  created_at: string
}

export interface Comment {
  id: string
  post_id: string
  content: string
  author_email: string | null
  author_name: string | null
  is_from_admin: boolean
  is_internal: boolean
  created_at: string
}

export interface ChangelogEntry {
  id: string
  org_id: string
  title: string
  content: string
  category: 'feature' | 'improvement' | 'fix'
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface Subscriber {
  id: string
  org_id: string
  email: string
  created_at: string
}

export interface WidgetSettings {
  id: string
  org_id: string
  widget_type: 'changelog' | 'feedback' | 'all-in-one'
  position: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
  accent_color: string
  button_text: string
  show_branding: boolean
  theme: 'light' | 'dark' | 'auto'
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  org_id: string
  name: string
  color: string
  created_at: string
}

export interface Invitation {
  id: string
  org_id: string
  email: string
  role: 'owner' | 'admin' | 'member'
  invited_by: string
  token: string
  expires_at: string
  accepted_at: string | null
  created_at: string
}

export interface NotificationPreferences {
  id: string
  user_id: string
  email_on_status_change: boolean
  email_on_comment: boolean
  email_on_new_feedback: boolean
  email_digest: boolean
  created_at: string
  updated_at: string
}

export interface Webhook {
  id: string
  org_id: string
  name: string
  url: string
  secret: string | null
  events: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ApiKey {
  id: string
  org_id: string
  name: string
  key_hash: string
  key_prefix: string
  last_used_at: string | null
  expires_at: string | null
  created_at: string
}

export interface Integration {
  id: string
  org_id: string
  type: 'slack' | 'discord'
  webhook_url: string | null
  channel_name: string | null
  notify_on_new_feedback: boolean
  notify_on_status_change: boolean
  notify_on_new_comment: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}
