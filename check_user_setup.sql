-- Check user setup in Supabase
-- Run this query to verify if a user is properly set up with an organization

-- Replace 'USER_EMAIL' with the email you want to check
-- Example: 'sarah@taskflow.io' or 'test1@gmail.com'

SELECT 
  u.id as user_id,
  u.email,
  u.email_confirmed_at,
  u.created_at as user_created_at,
  u.raw_user_meta_data->>'name' as name,
  om.id as membership_id,
  om.org_id,
  om.role,
  o.name as org_name,
  o.slug as org_slug,
  o.created_at as org_created_at
FROM auth.users u
LEFT JOIN org_members om ON u.id = om.user_id
LEFT JOIN organizations o ON om.org_id = o.id
WHERE u.email = 'USER_EMAIL'  -- Replace with actual email
ORDER BY u.created_at DESC;

-- To check all users and their organization status:
SELECT 
  u.id as user_id,
  u.email,
  CASE 
    WHEN om.id IS NULL THEN 'No organization'
    ELSE 'Has organization'
  END as status,
  o.name as org_name,
  om.role
FROM auth.users u
LEFT JOIN org_members om ON u.id = om.user_id
LEFT JOIN organizations o ON om.org_id = o.id
ORDER BY u.created_at DESC;
