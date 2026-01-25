CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email_on_status_change BOOLEAN DEFAULT true,
  email_on_comment BOOLEAN DEFAULT true,
  email_on_new_feedback BOOLEAN DEFAULT true,
  email_digest BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
