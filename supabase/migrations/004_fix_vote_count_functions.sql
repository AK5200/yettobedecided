-- Ensure vote_count starts at 0 for existing rows
UPDATE posts
SET vote_count = 0
WHERE vote_count IS NULL;

-- Make vote_count updates resilient to NULL values
CREATE OR REPLACE FUNCTION increment_vote_count(post_id_input UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts
  SET vote_count = COALESCE(vote_count, 0) + 1
  WHERE id = post_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_vote_count(post_id_input UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts
  SET vote_count = GREATEST(COALESCE(vote_count, 0) - 1, 0)
  WHERE id = post_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
