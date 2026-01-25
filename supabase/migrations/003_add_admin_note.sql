-- Add admin_note for rejection reasons etc
ALTER TABLE posts ADD COLUMN IF NOT EXISTS admin_note TEXT;
