-- Cleanup duplicate organizations for a user
-- This script will help you clean up duplicate organizations and set up users properly

-- ============================================
-- STEP 1: View all organizations for a user
-- ============================================
-- Replace 'USER_EMAIL' with the email you want to check
SELECT 
  u.email,
  o.id as org_id,
  o.name as org_name,
  o.slug as org_slug,
  om.role,
  om.created_at as membership_created_at,
  o.created_at as org_created_at,
  (SELECT COUNT(*) FROM boards WHERE org_id = o.id) as board_count,
  (SELECT COUNT(*) FROM posts WHERE board_id IN (SELECT id FROM boards WHERE org_id = o.id)) as post_count
FROM auth.users u
JOIN org_members om ON u.id = om.user_id
JOIN organizations o ON om.org_id = o.id
WHERE u.email = 'sarah@taskflow.com'  -- Replace with actual email
ORDER BY o.created_at ASC;

-- ============================================
-- STEP 2: Choose which organization to keep
-- ============================================
-- Review the results above and decide which org_id to KEEP
-- The script below will:
-- 1. Move all boards from duplicate orgs to the main org
-- 2. Update all related data
-- 3. Delete duplicate organizations

-- IMPORTANT: Replace 'KEEP_ORG_ID' with the UUID of the organization you want to keep
-- Replace 'DELETE_ORG_ID_1', 'DELETE_ORG_ID_2', etc. with UUIDs of orgs to delete

DO $$
DECLARE
  v_user_id UUID;
  v_keep_org_id UUID := 'KEEP_ORG_ID'::UUID;  -- Replace with actual org ID to keep
  v_delete_org_ids UUID[] := ARRAY['DELETE_ORG_ID_1'::UUID, 'DELETE_ORG_ID_2'::UUID];  -- Replace with org IDs to delete
  v_org_id UUID;
  v_board_id UUID;
  v_board_record RECORD;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'sarah@taskflow.com';  -- Replace with actual email
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Loop through each org to delete
  FOREACH v_org_id IN ARRAY v_delete_org_ids
  LOOP
    -- Move all boards from this org to the keep org
    FOR v_board_record IN 
      SELECT id FROM boards WHERE org_id = v_org_id
    LOOP
      -- Update board to point to keep org
      UPDATE boards 
      SET org_id = v_keep_org_id,
          slug = slug || '-' || SUBSTRING(v_org_id::TEXT, 1, 8)  -- Make slug unique
      WHERE id = v_board_record.id;
      
      RAISE NOTICE 'Moved board % to org %', v_board_record.id, v_keep_org_id;
    END LOOP;
    
    -- Delete org_members entry
    DELETE FROM org_members WHERE org_id = v_org_id AND user_id = v_user_id;
    
    -- Delete the organization (cascade will handle related data)
    DELETE FROM organizations WHERE id = v_org_id;
    
    RAISE NOTICE 'Deleted organization %', v_org_id;
  END LOOP;
  
  RAISE NOTICE '✅ Cleanup complete!';
END $$;

-- ============================================
-- STEP 3: Set up sarah@taskflow.io with organization
-- ============================================
-- This will create an organization for sarah@taskflow.io

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
  
  RAISE NOTICE '✅ Successfully created organization and linked user!';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Organization ID: %', v_org_id;
  RAISE NOTICE 'Organization: TaskFlow.io (slug: taskflow-io)';
END $$;

-- ============================================
-- STEP 4: Verify the cleanup
-- ============================================
SELECT 
  u.email,
  o.id as org_id,
  o.name as org_name,
  o.slug as org_slug,
  om.role,
  (SELECT COUNT(*) FROM boards WHERE org_id = o.id) as board_count
FROM auth.users u
JOIN org_members om ON u.id = om.user_id
JOIN organizations o ON om.org_id = o.id
WHERE u.email IN ('sarah@taskflow.com', 'sarah@taskflow.io')
ORDER BY u.email, o.created_at;
