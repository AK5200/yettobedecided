-- Add priority_category column for direct categorization
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS priority_category TEXT
  CHECK (priority_category IN ('quick_wins', 'big_bets', 'fill_ins', 'time_sinks', 'drop'))
  DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_posts_priority_category ON posts(priority_category) WHERE priority_category IS NOT NULL;
