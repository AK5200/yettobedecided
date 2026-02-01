-- SSO settings for organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sso_secret_key TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sso_mode TEXT DEFAULT 'guest_only';

-- Add constraint for sso_mode values
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_sso_mode_check;
ALTER TABLE organizations ADD CONSTRAINT organizations_sso_mode_check
  CHECK (sso_mode IN ('guest_only', 'trust', 'jwt_required'));

-- Add identified user fields to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS identified_user_id TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS identified_user_avatar TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS user_source TEXT DEFAULT 'guest';

-- Add constraint for user_source values
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_user_source_check;
ALTER TABLE posts ADD CONSTRAINT posts_user_source_check
  CHECK (user_source IN ('guest', 'identified', 'verified_sso'));

-- Add identified user fields to comments
ALTER TABLE comments ADD COLUMN IF NOT EXISTS identified_user_id TEXT;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS identified_user_avatar TEXT;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS user_source TEXT DEFAULT 'guest';

-- Add constraint for user_source values
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_user_source_check;
ALTER TABLE comments ADD CONSTRAINT comments_user_source_check
  CHECK (user_source IN ('guest', 'identified', 'verified_sso'));

-- Add identified user fields to votes
ALTER TABLE votes ADD COLUMN IF NOT EXISTS identified_user_id TEXT;
ALTER TABLE votes ADD COLUMN IF NOT EXISTS identified_user_name TEXT;
ALTER TABLE votes ADD COLUMN IF NOT EXISTS identified_user_avatar TEXT;
ALTER TABLE votes ADD COLUMN IF NOT EXISTS user_source TEXT DEFAULT 'guest';

-- Add constraint for user_source values
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_user_source_check;
ALTER TABLE votes ADD CONSTRAINT votes_user_source_check
  CHECK (user_source IN ('guest', 'identified', 'verified_sso'));
