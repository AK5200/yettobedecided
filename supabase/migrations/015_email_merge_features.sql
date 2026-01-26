-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_new_post BOOLEAN DEFAULT true,
  email_status_change BOOLEAN DEFAULT true,
  email_new_comment BOOLEAN DEFAULT true,
  email_new_vote BOOLEAN DEFAULT false,
  email_post_merged BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add merge columns to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS merged_into_id UUID REFERENCES posts(id);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS merged_at TIMESTAMP;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS merged_by_id UUID REFERENCES auth.users(id);

-- Add internal flag to comments
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_internal BOOLEAN DEFAULT false;

-- Add guest posting columns
ALTER TABLE posts ADD COLUMN IF NOT EXISTS guest_email VARCHAR(255);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS guest_name VARCHAR(255);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false;
