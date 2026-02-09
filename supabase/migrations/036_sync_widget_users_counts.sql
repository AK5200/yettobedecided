-- Sync widget_users vote_count and comment_count from actual votes and comments tables
-- This ensures accurate counts for existing users

DO $$
DECLARE
  org_record RECORD;
  widget_user_record RECORD;
  vote_count INT;
  comment_count INT;
BEGIN
  -- Loop through each organization
  FOR org_record IN SELECT id FROM organizations LOOP
    -- Loop through each widget_user in this org
    FOR widget_user_record IN 
      SELECT id, email FROM widget_users WHERE org_id = org_record.id
    LOOP
      -- Count votes for this user
      SELECT COUNT(*) INTO vote_count
      FROM votes v
      JOIN posts p ON v.post_id = p.id
      JOIN boards b ON p.board_id = b.id
      WHERE b.org_id = org_record.id
        AND LOWER(v.voter_email) = LOWER(widget_user_record.email);
      
      -- Count comments for this user
      SELECT COUNT(*) INTO comment_count
      FROM comments c
      JOIN posts p ON c.post_id = p.id
      JOIN boards b ON p.board_id = b.id
      WHERE b.org_id = org_record.id
        AND LOWER(c.author_email) = LOWER(widget_user_record.email);
      
      -- Update widget_user counts
      UPDATE widget_users
      SET 
        vote_count = vote_count,
        comment_count = comment_count
      WHERE id = widget_user_record.id;
    END LOOP;
  END LOOP;
END $$;
