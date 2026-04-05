-- Add granular guest access controls
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS guest_commenting_enabled BOOLEAN DEFAULT true;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS guest_voting_enabled BOOLEAN DEFAULT true;
