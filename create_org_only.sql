-- Create organization for sarah@taskflow.io
-- Run this AFTER creating the user via Dashboard > Authentication > Users

DO $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
BEGIN
  -- Get the user ID
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'sarah@taskflow.io';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User sarah@taskflow.io not found. Please create the user first via Dashboard > Authentication > Users';
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
  
  RAISE NOTICE '✅ Success!';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Organization ID: %', v_org_id;
END $$;

-- Verify
SELECT 
  u.email,
  u.raw_user_meta_data->>'name' as name,
  o.name as organization,
  o.slug as org_slug,
  om.role
FROM auth.users u
JOIN org_members om ON u.id = om.user_id
JOIN organizations o ON om.org_id = o.id
WHERE u.email = 'sarah@taskflow.io';
