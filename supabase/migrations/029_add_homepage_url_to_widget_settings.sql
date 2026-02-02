-- Add homepage_url field to widget_settings for auto-trigger feature
ALTER TABLE widget_settings ADD COLUMN IF NOT EXISTS homepage_url TEXT;
ALTER TABLE widget_settings ADD COLUMN IF NOT EXISTS auto_trigger_enabled BOOLEAN DEFAULT false;
