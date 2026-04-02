-- Add moderation and anonymous posting settings to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS post_moderation BOOLEAN DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS comment_moderation BOOLEAN DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS allow_anonymous_posts BOOLEAN DEFAULT false;
