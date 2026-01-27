-- Add widget type column if not exists
ALTER TABLE widget_settings ADD COLUMN IF NOT EXISTS widget_type VARCHAR(50) DEFAULT 'floating';

-- Widget types: floating, popup, dropdown, announcement
-- floating = existing button widget
-- popup = changelog popup on return
-- dropdown = small dropdown
-- announcement = top bar
