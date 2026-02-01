-- Add extended widget settings columns for dynamic configuration
ALTER TABLE widget_settings ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#ffffff';
ALTER TABLE widget_settings ADD COLUMN IF NOT EXISTS size TEXT DEFAULT 'large';
ALTER TABLE widget_settings ADD COLUMN IF NOT EXISTS border_radius TEXT DEFAULT 'medium';
ALTER TABLE widget_settings ADD COLUMN IF NOT EXISTS shadow TEXT DEFAULT 'large';
ALTER TABLE widget_settings ADD COLUMN IF NOT EXISTS heading TEXT DEFAULT 'Welcome back 👋';
ALTER TABLE widget_settings ADD COLUMN IF NOT EXISTS subheading TEXT DEFAULT 'Here''s what we added while you were away.';

-- Announcement-specific settings
ALTER TABLE widget_settings ADD COLUMN IF NOT EXISTS announcement_tag TEXT DEFAULT 'New';
ALTER TABLE widget_settings ADD COLUMN IF NOT EXISTS announcement_text TEXT DEFAULT '';
ALTER TABLE widget_settings ADD COLUMN IF NOT EXISTS announcement_link_type TEXT DEFAULT 'changelog';
ALTER TABLE widget_settings ADD COLUMN IF NOT EXISTS announcement_custom_url TEXT DEFAULT '';
