-- Create statuses table for customizable post statuses
CREATE TABLE IF NOT EXISTS statuses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280',
  "order" INTEGER NOT NULL DEFAULT 0,
  is_system BOOLEAN NOT NULL DEFAULT false,
  show_on_roadmap BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, key)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_statuses_org_id ON statuses(org_id);
CREATE INDEX IF NOT EXISTS idx_statuses_key ON statuses(org_id, key);

-- Enable RLS
ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Users can read org statuses" ON statuses;
DROP POLICY IF EXISTS "Admins can insert statuses" ON statuses;
DROP POLICY IF EXISTS "Admins can update statuses" ON statuses;
DROP POLICY IF EXISTS "Admins can delete statuses" ON statuses;

-- Policy: Users can read statuses of their org
CREATE POLICY "Users can read org statuses" ON statuses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = statuses.org_id
      AND org_members.user_id = auth.uid()
    )
  );

-- Policy: Admins/Owners can insert statuses
CREATE POLICY "Admins can insert statuses" ON statuses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = statuses.org_id
      AND org_members.user_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
    )
  );

-- Policy: Admins/Owners can update statuses
CREATE POLICY "Admins can update statuses" ON statuses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = statuses.org_id
      AND org_members.user_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
    )
  );

-- Policy: Admins/Owners can delete statuses
CREATE POLICY "Admins can delete statuses" ON statuses
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = statuses.org_id
      AND org_members.user_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
    )
  );
