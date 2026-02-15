-- Add auto_sync_enabled column to linear_integrations
ALTER TABLE linear_integrations
  ADD COLUMN IF NOT EXISTS auto_sync_enabled BOOLEAN DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN linear_integrations.auto_sync_enabled IS 'When true, new feedback posts will automatically sync to Linear';
