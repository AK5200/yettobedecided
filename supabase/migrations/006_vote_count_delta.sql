-- Adjust vote_count by a delta to support multi-row deletes
CREATE OR REPLACE FUNCTION adjust_vote_count(post_id_input UUID, delta_input INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE posts
  SET vote_count = GREATEST(COALESCE(vote_count, 0) + delta_input, 0)
  WHERE id = post_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
