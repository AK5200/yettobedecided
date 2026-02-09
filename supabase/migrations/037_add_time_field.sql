-- Add time field for prioritization matrix
ALTER TABLE posts 
  ADD COLUMN IF NOT EXISTS time TEXT 
  CHECK (time IN ('easy', 'mid', 'high')) 
  DEFAULT NULL;

-- Index for filtering
CREATE INDEX IF NOT EXISTS idx_posts_time ON posts(time) WHERE time IS NOT NULL;
