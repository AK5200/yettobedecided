-- Add allow_comments and allow_voting columns to boards (defaulting to true)
ALTER TABLE boards ADD COLUMN IF NOT EXISTS allow_comments BOOLEAN DEFAULT true;
ALTER TABLE boards ADD COLUMN IF NOT EXISTS allow_voting BOOLEAN DEFAULT true;
