ALTER TABLE posts ADD COLUMN IF NOT EXISTS widget_user_id UUID REFERENCES widget_users(id) ON DELETE SET NULL;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS widget_user_id UUID REFERENCES widget_users(id) ON DELETE SET NULL;
ALTER TABLE votes ADD COLUMN IF NOT EXISTS widget_user_id UUID REFERENCES widget_users(id) ON DELETE SET NULL;

CREATE INDEX idx_posts_widget_user ON posts(widget_user_id) WHERE widget_user_id IS NOT NULL;
CREATE INDEX idx_comments_widget_user ON comments(widget_user_id) WHERE widget_user_id IS NOT NULL;
CREATE INDEX idx_votes_widget_user ON votes(widget_user_id) WHERE widget_user_id IS NOT NULL;
