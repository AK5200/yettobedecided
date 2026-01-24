-- Function to increment vote count
CREATE OR REPLACE FUNCTION increment_vote_count(post_id_input UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts
  SET vote_count = vote_count + 1
  WHERE id = post_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement vote count
CREATE OR REPLACE FUNCTION decrement_vote_count(post_id_input UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts
  SET vote_count = GREATEST(vote_count - 1, 0)
  WHERE id = post_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
