-- Recompute vote_count from votes table
UPDATE posts
SET vote_count = COALESCE(v.count, 0)
FROM (
  SELECT post_id, COUNT(*)::int AS count
  FROM votes
  GROUP BY post_id
) v
WHERE posts.id = v.post_id;

-- Ensure posts with zero votes are set to 0
UPDATE posts
SET vote_count = 0
WHERE id NOT IN (SELECT DISTINCT post_id FROM votes);




