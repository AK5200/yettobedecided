-- Linear integrations table
CREATE TABLE IF NOT EXISTS linear_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  team_id VARCHAR(255),
  team_name VARCHAR(255),
  connected_by_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(org_id)
);

-- Add Linear issue reference to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS linear_issue_id VARCHAR(255);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS linear_issue_url VARCHAR(500);
