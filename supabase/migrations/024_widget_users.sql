-- Widget Users Table
CREATE TABLE IF NOT EXISTS widget_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Identity
  external_id TEXT,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  
  -- Source
  user_source TEXT NOT NULL DEFAULT 'guest' 
    CHECK (user_source IN ('guest', 'social_google', 'social_github', 'identified', 'verified_jwt')),
  
  -- Company (B2B)
  company_id TEXT,
  company_name TEXT,
  company_plan TEXT,
  company_monthly_spend DECIMAL(10,2),
  
  -- Engagement
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  post_count INTEGER DEFAULT 0,
  vote_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  
  -- Moderation
  is_banned BOOLEAN DEFAULT FALSE,
  banned_at TIMESTAMPTZ,
  banned_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_widget_users_org ON widget_users(org_id);
CREATE UNIQUE INDEX idx_widget_users_org_email ON widget_users(org_id, LOWER(email));
CREATE UNIQUE INDEX idx_widget_users_org_external ON widget_users(org_id, external_id) WHERE external_id IS NOT NULL;

-- RLS
ALTER TABLE widget_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view widget_users"
  ON widget_users FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Service role full access"
  ON widget_users FOR ALL
  USING (auth.role() = 'service_role');
