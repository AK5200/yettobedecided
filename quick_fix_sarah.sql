-- Quick fix for sarah@taskflow.com - Keep only one organization
-- This script will keep the FIRST organization (oldest) and delete the others

DO $$
DECLARE
  v_user_id UUID;
  v_keep_org_id UUID;
  v_org_id UUID;
  v_board_record RECORD;
  v_org_record RECORD;
  v_orgs_to_delete UUID[] := '{}';
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'sarah@taskflow.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User sarah@taskflow.com not found';
  END IF;
  
  -- Get the first (oldest) organization to keep
  SELECT om.org_id INTO v_keep_org_id
  FROM org_members om
  JOIN organizations o ON om.org_id = o.id
  WHERE om.user_id = v_user_id
  ORDER BY o.created_at ASC
  LIMIT 1;
  
  IF v_keep_org_id IS NULL THEN
    RAISE EXCEPTION 'No organization found for user';
  END IF;
  
  RAISE NOTICE 'Keeping organization: %', v_keep_org_id;
  
  -- Collect all other org IDs to delete
  FOR v_org_record IN 
    SELECT om.org_id
    FROM org_members om
    WHERE om.user_id = v_user_id AND om.org_id != v_keep_org_id
  LOOP
    v_orgs_to_delete := array_append(v_orgs_to_delete, v_org_record.org_id);
    RAISE NOTICE 'Will delete organization: %', v_org_record.org_id;
  END LOOP;
  
  -- Process each org to delete
  FOREACH v_org_id IN ARRAY v_orgs_to_delete
  LOOP
    -- Move all boards from this org to the keep org
    FOR v_board_record IN 
      SELECT id, slug FROM boards WHERE org_id = v_org_id
    LOOP
      -- Check if slug already exists in keep org
      IF EXISTS (SELECT 1 FROM boards WHERE org_id = v_keep_org_id AND slug = v_board_record.slug) THEN
        -- Make slug unique by appending timestamp
        UPDATE boards 
        SET org_id = v_keep_org_id,
            slug = v_board_record.slug || '-' || SUBSTRING(v_org_id::TEXT, 1, 8)
        WHERE id = v_board_record.id;
      ELSE
        -- Just move the board
        UPDATE boards 
        SET org_id = v_keep_org_id
        WHERE id = v_board_record.id;
      END IF;
      
      RAISE NOTICE 'Moved board % to org %', v_board_record.id, v_keep_org_id;
    END LOOP;
    
    -- Delete org_members entry
    DELETE FROM org_members WHERE org_id = v_org_id AND user_id = v_user_id;
    
    -- Delete the organization (cascade will handle related data)
    DELETE FROM organizations WHERE id = v_org_id;
    
    RAISE NOTICE 'Deleted organization %', v_org_id;
  END LOOP;
  
  RAISE NOTICE '✅ Cleanup complete! User now has only one organization: %', v_keep_org_id;
END $$;

-- Set up sarah@taskflow.io
DO $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'sarah@taskflow.io';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User sarah@taskflow.io not found. Please create the user first via Supabase Dashboard > Authentication > Users';
  END IF;
  
  -- Check if user already has an org
  SELECT org_id INTO v_org_id
  FROM org_members
  WHERE user_id = v_user_id
  LIMIT 1;
  
  IF v_org_id IS NOT NULL THEN
    RAISE NOTICE 'User already has an organization: %', v_org_id;
    RETURN;
  END IF;
  
  -- Create organization
  INSERT INTO organizations (name, slug)
  VALUES ('TaskFlow.io', 'taskflow-io')
  ON CONFLICT (slug) DO UPDATE SET name = 'TaskFlow.io'
  RETURNING id INTO v_org_id;
  
  -- Get org ID if it already exists
  IF v_org_id IS NULL THEN
    SELECT id INTO v_org_id FROM organizations WHERE slug = 'taskflow-io';
  END IF;
  
  -- Link user to organization as owner
  INSERT INTO org_members (org_id, user_id, role)
  VALUES (v_org_id, v_user_id, 'owner')
  ON CONFLICT (org_id, user_id) DO UPDATE SET role = 'owner';
  
  RAISE NOTICE '✅ Successfully created organization for sarah@taskflow.io!';
  RAISE NOTICE 'Organization ID: %', v_org_id;
END $$;

-- Verify results
SELECT 
  u.email,
  o.name as org_name,
  o.slug,
  om.role,
  (SELECT COUNT(*) FROM boards WHERE org_id = o.id) as board_count
FROM auth.users u
JOIN org_members om ON u.id = om.user_id
JOIN organizations o ON om.org_id = o.id
WHERE u.email IN ('sarah@taskflow.com', 'sarah@taskflow.io')
ORDER BY u.email;
