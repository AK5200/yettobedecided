-- User identification settings
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS guest_posting_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS social_login_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS sso_redirect_url TEXT,
  ADD COLUMN IF NOT EXISTS sso_redirect_enabled BOOLEAN DEFAULT FALSE;
