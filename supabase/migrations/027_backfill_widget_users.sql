-- Backfill widget_users from existing posts, comments, and votes
-- This migration creates widget_users entries for all existing users
-- based on their email/name from posts, comments, and votes

DO $$
DECLARE
  org_record RECORD;
  post_record RECORD;
  comment_record RECORD;
  vote_record RECORD;
  user_email TEXT;
  user_name TEXT;
  widget_user_id UUID;
  first_activity TIMESTAMPTZ;
  post_count INT;
  vote_count INT;
  comment_count INT;
BEGIN
  -- Loop through each organization
  FOR org_record IN SELECT id FROM organizations LOOP
    -- Process posts
    FOR post_record IN 
      SELECT DISTINCT
        COALESCE(p.author_email, p.guest_email) as email,
        COALESCE(p.author_name, p.guest_name) as name,
        MIN(p.created_at) as first_seen,
        COUNT(*) as post_count
      FROM posts p
      WHERE p.board_id IN (SELECT id FROM boards WHERE org_id = org_record.id)
        AND COALESCE(p.author_email, p.guest_email) IS NOT NULL
      GROUP BY COALESCE(p.author_email, p.guest_email), COALESCE(p.author_name, p.guest_name)
    LOOP
      user_email := post_record.email;
      user_name := post_record.name;
      first_activity := post_record.first_seen;
      
      -- Check if widget_user already exists
      SELECT id INTO widget_user_id
      FROM widget_users
      WHERE org_id = org_record.id
        AND LOWER(email) = LOWER(user_email)
      LIMIT 1;
      
      IF widget_user_id IS NULL THEN
        -- Create new widget_user
        INSERT INTO widget_users (
          org_id,
          email,
          name,
          user_source,
          first_seen_at,
          last_seen_at,
          post_count,
          created_at,
          updated_at
        ) VALUES (
          org_record.id,
          user_email,
          user_name,
          'guest',
          first_activity,
          first_activity,
          post_record.post_count,
          first_activity,
          NOW()
        )
        ON CONFLICT DO NOTHING;
      ELSE
        -- Update existing widget_user
        UPDATE widget_users
        SET 
          name = COALESCE(user_name, name),
          first_seen_at = LEAST(first_seen_at, first_activity),
          last_seen_at = GREATEST(last_seen_at, first_activity),
          post_count = post_count + post_record.post_count,
          updated_at = NOW()
        WHERE id = widget_user_id;
      END IF;
    END LOOP;
    
    -- Process comments
    FOR comment_record IN
      SELECT DISTINCT
        COALESCE(c.author_email, c.guest_email) as email,
        COALESCE(c.author_name, c.guest_name) as name,
        MIN(c.created_at) as first_seen,
        COUNT(*) as comment_count
      FROM comments c
      WHERE c.post_id IN (
        SELECT id FROM posts WHERE board_id IN (SELECT id FROM boards WHERE org_id = org_record.id)
      )
        AND COALESCE(c.author_email, c.guest_email) IS NOT NULL
      GROUP BY COALESCE(c.author_email, c.guest_email), COALESCE(c.author_name, c.guest_name)
    LOOP
      user_email := comment_record.email;
      user_name := comment_record.name;
      first_activity := comment_record.first_seen;
      
      -- Check if widget_user already exists
      SELECT id INTO widget_user_id
      FROM widget_users
      WHERE org_id = org_record.id
        AND LOWER(email) = LOWER(user_email)
      LIMIT 1;
      
      IF widget_user_id IS NULL THEN
        -- Create new widget_user
        INSERT INTO widget_users (
          org_id,
          email,
          name,
          user_source,
          first_seen_at,
          last_seen_at,
          comment_count,
          created_at,
          updated_at
        ) VALUES (
          org_record.id,
          user_email,
          user_name,
          'guest',
          first_activity,
          first_activity,
          comment_record.comment_count,
          first_activity,
          NOW()
        )
        ON CONFLICT DO NOTHING;
      ELSE
        -- Update existing widget_user
        UPDATE widget_users
        SET 
          name = COALESCE(user_name, name),
          first_seen_at = LEAST(first_seen_at, first_activity),
          last_seen_at = GREATEST(last_seen_at, first_activity),
          comment_count = comment_count + comment_record.comment_count,
          updated_at = NOW()
        WHERE id = widget_user_id;
      END IF;
    END LOOP;
    
    -- Process votes
    FOR vote_record IN
      SELECT DISTINCT
        COALESCE(v.voter_email, v.identified_user_id) as email,
        COALESCE(v.voter_name, v.identified_user_name) as name,
        MIN(v.created_at) as first_seen,
        COUNT(*) as vote_count
      FROM votes v
      WHERE v.post_id IN (
        SELECT id FROM posts WHERE board_id IN (SELECT id FROM boards WHERE org_id = org_record.id)
      )
        AND COALESCE(v.voter_email, v.identified_user_id) IS NOT NULL
      GROUP BY COALESCE(v.voter_email, v.identified_user_id), COALESCE(v.voter_name, v.identified_user_name)
    LOOP
      user_email := vote_record.email;
      user_name := vote_record.name;
      first_activity := vote_record.first_seen;
      
      -- Check if widget_user already exists
      SELECT id INTO widget_user_id
      FROM widget_users
      WHERE org_id = org_record.id
        AND LOWER(email) = LOWER(user_email)
      LIMIT 1;
      
      IF widget_user_id IS NULL THEN
        -- Create new widget_user
        INSERT INTO widget_users (
          org_id,
          email,
          name,
          user_source,
          first_seen_at,
          last_seen_at,
          vote_count,
          created_at,
          updated_at
        ) VALUES (
          org_record.id,
          user_email,
          user_name,
          'guest',
          first_activity,
          first_activity,
          vote_record.vote_count,
          first_activity,
          NOW()
        )
        ON CONFLICT DO NOTHING;
      ELSE
        -- Update existing widget_user
        UPDATE widget_users
        SET 
          name = COALESCE(user_name, name),
          first_seen_at = LEAST(first_seen_at, first_activity),
          last_seen_at = GREATEST(last_seen_at, first_activity),
          vote_count = vote_count + vote_record.vote_count,
          updated_at = NOW()
        WHERE id = widget_user_id;
      END IF;
    END LOOP;
    
    -- Update widget_user_id in posts, comments, and votes
    -- Link posts to widget_users
    UPDATE posts p
    SET widget_user_id = wu.id
    FROM widget_users wu
    WHERE p.board_id IN (SELECT id FROM boards WHERE org_id = org_record.id)
      AND wu.org_id = org_record.id
      AND LOWER(COALESCE(p.author_email, p.guest_email)) = LOWER(wu.email)
      AND p.widget_user_id IS NULL;
    
    -- Link comments to widget_users
    UPDATE comments c
    SET widget_user_id = wu.id
    FROM widget_users wu, posts p, boards b
    WHERE c.post_id = p.id
      AND p.board_id = b.id
      AND b.org_id = org_record.id
      AND wu.org_id = org_record.id
      AND LOWER(COALESCE(c.author_email, c.guest_email)) = LOWER(wu.email)
      AND c.widget_user_id IS NULL;
    
    -- Link votes to widget_users
    UPDATE votes v
    SET widget_user_id = wu.id
    FROM widget_users wu, posts p, boards b
    WHERE v.post_id = p.id
      AND p.board_id = b.id
      AND b.org_id = org_record.id
      AND wu.org_id = org_record.id
      AND LOWER(COALESCE(v.voter_email, v.identified_user_id)) = LOWER(wu.email)
      AND v.widget_user_id IS NULL;
      
  END LOOP;
END $$;
