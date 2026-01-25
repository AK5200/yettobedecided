-- Remove duplicate votes, keeping the oldest row per (post_id, voter_email)
DELETE FROM votes a
USING votes b
WHERE a.post_id = b.post_id
  AND a.voter_email = b.voter_email
  AND a.id > b.id;

-- Prevent duplicate votes for the same post and email
CREATE UNIQUE INDEX IF NOT EXISTS votes_unique_post_email
  ON votes (post_id, voter_email);
