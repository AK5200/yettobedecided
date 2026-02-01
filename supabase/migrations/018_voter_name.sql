-- Add voter_name column to votes table
ALTER TABLE votes ADD COLUMN IF NOT EXISTS voter_name TEXT;
