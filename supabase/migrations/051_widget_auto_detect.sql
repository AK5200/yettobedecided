-- Add auto-detect settings to widget_settings
ALTER TABLE widget_settings ADD COLUMN IF NOT EXISTS auto_detect_theme BOOLEAN DEFAULT false;
ALTER TABLE widget_settings ADD COLUMN IF NOT EXISTS auto_detect_color BOOLEAN DEFAULT false;
