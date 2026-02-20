-- Add login_handler column to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS login_handler TEXT;

-- Add constraint for login_handler values
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_login_handler_check;
ALTER TABLE organizations ADD CONSTRAINT organizations_login_handler_check
  CHECK (login_handler IN ('kelo', 'customer'));

-- Migrate existing data:
-- If social_login_enabled = true, set login_handler = 'kelo'
UPDATE organizations 
SET login_handler = 'kelo' 
WHERE social_login_enabled = true AND login_handler IS NULL;
