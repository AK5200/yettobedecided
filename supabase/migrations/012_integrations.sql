CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  webhook_url TEXT,
  channel_name TEXT,
  notify_on_new_feedback BOOLEAN DEFAULT true,
  notify_on_status_change BOOLEAN DEFAULT true,
  notify_on_new_comment BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, type)
);
