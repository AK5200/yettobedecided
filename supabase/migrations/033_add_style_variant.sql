-- Add style variant column for all-in-one widget
ALTER TABLE widget_settings ADD COLUMN IF NOT EXISTS all_in_one_style_variant TEXT DEFAULT '1';