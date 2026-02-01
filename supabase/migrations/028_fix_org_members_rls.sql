-- Fix RLS policy for org_members to allow users to see their own membership
-- The previous policy was circular: users could only see memberships for orgs they're already in
-- This prevents new users from seeing their own membership records

-- Drop the old policy
DROP POLICY IF EXISTS "Users can view members of their orgs" ON org_members;

-- Create a new policy that allows:
-- 1. Users to see their own membership records (user_id = auth.uid())
-- 2. Users to see members of orgs they belong to
CREATE POLICY "Users can view members of their orgs" ON org_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );
