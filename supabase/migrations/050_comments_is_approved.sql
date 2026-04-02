-- Add is_approved column to comments (default true so existing comments stay visible)
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;
