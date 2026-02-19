-- Add onboarding tracking to organizations
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;

-- Backfill: existing orgs with boards are already onboarded
UPDATE organizations
SET onboarding_completed = TRUE, onboarding_step = 6
WHERE id IN (SELECT DISTINCT org_id FROM boards);
