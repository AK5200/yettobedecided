-- =====================================================
-- SLACK OAUTH INTEGRATION
-- =====================================================

-- Add columns to integrations table for OAuth tokens
ALTER TABLE integrations
ADD COLUMN IF NOT EXISTS access_token TEXT,
ADD COLUMN IF NOT EXISTS team_id TEXT,
ADD COLUMN IF NOT EXISTS team_name TEXT,
ADD COLUMN IF NOT EXISTS channel_id TEXT,
ADD COLUMN IF NOT EXISTS bot_user_id TEXT,
ADD COLUMN IF NOT EXISTS installed_by TEXT,
ADD COLUMN IF NOT EXISTS installed_at TIMESTAMPTZ DEFAULT NOW();

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_integrations_team ON integrations(team_id) WHERE type = 'slack';

-- Comments
COMMENT ON COLUMN integrations.access_token IS 'Slack Bot OAuth access token';
COMMENT ON COLUMN integrations.team_id IS 'Slack workspace ID';
COMMENT ON COLUMN integrations.channel_id IS 'Selected Slack channel ID';
