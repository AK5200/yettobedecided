-- Add effort field for prioritization matrix
ALTER TABLE posts 
  ADD COLUMN IF NOT EXISTS effort TEXT 
  CHECK (effort IN ('low', 'medium', 'high')) 
  DEFAULT NULL;

-- Index for filtering
CREATE INDEX IF NOT EXISTS idx_posts_effort ON posts(effort) WHERE effort IS NOT NULL;
