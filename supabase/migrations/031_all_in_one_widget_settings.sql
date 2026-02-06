-- Add all-in-one widget specific settings
ALTER TABLE widget_settings ADD COLUMN IF NOT EXISTS all_in_one_text_style TEXT DEFAULT 'default';
ALTER TABLE widget_settings ADD COLUMN IF NOT EXISTS all_in_one_popover_placement TEXT DEFAULT 'bottom-right';
ALTER TABLE widget_settings ADD COLUMN IF NOT EXISTS all_in_one_popup_placement TEXT DEFAULT 'right';
ALTER TABLE widget_settings ADD COLUMN IF NOT EXISTS all_in_one_popup_width INTEGER DEFAULT 420;
