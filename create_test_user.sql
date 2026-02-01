-- Create test user: sarah@taskflow.io
-- Run this in Supabase SQL Editor

-- IMPORTANT: You must create the user FIRST via Supabase Dashboard:
-- 1. Go to: Supabase Dashboard > Authentication > Users
-- 2. Click "Add User" > "Create new user"
-- 3. Email: sarah@taskflow.io
-- 4. Password: (set any password, e.g., "TempPass123!")
-- 5. Check "Auto Confirm User"
-- 6. Click "Create user"
-- 7. Then run this script below

-- Create organization and link user
DO $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
BEGIN
  -- Check if user exists
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'sarah@taskflow.io';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User sarah@taskflow.io not found. Please create the user first:
    
    1. Go to Supabase Dashboard > Authentication > Users
    2. Click "Add User" > "Create new user"
    3. Email: sarah@taskflow.io
    4. Password: (set any password)
    5. Check "Auto Confirm User"
    6. Click "Create user"
    7. Then run this script again';
  END IF;
  
  -- Update user metadata to set name
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"name": "Sarah"}'::jsonb
  WHERE id = v_user_id;
  
  -- Create organization
  INSERT INTO organizations (name, slug)
  VALUES ('taskflow.io', 'taskflow-io')
  ON CONFLICT (slug) DO NOTHING
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
  RAISE NOTICE 'Organization: taskflow.io (slug: taskflow-io)';
END $$;

-- Verify the setup
SELECT 
  u.id as user_id,
  u.email,
  u.raw_user_meta_data->>'name' as name,
  o.id as org_id,
  o.name as org_name,
  o.slug as org_slug,
  om.role
FROM auth.users u
JOIN org_members om ON u.id = om.user_id
JOIN organizations o ON om.org_id = o.id
WHERE u.email = 'sarah@taskflow.io';
