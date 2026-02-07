-- Add header_background_color column to widget_settings table
ALTER TABLE widget_settings
ADD COLUMN IF NOT EXISTS header_background_color TEXT;
