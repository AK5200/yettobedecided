CREATE TABLE IF NOT EXISTS widget_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  widget_type TEXT NOT NULL DEFAULT 'all-in-one',
  position TEXT NOT NULL DEFAULT 'bottom-right',
  accent_color TEXT NOT NULL DEFAULT '#000000',
  button_text TEXT NOT NULL DEFAULT 'Feedback',
  show_branding BOOLEAN NOT NULL DEFAULT true,
  theme TEXT NOT NULL DEFAULT 'light',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id)
);
