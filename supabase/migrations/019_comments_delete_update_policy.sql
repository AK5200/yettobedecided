-- Add DELETE and UPDATE policies for comments and posts (for admin actions)

-- Allow org members to delete comments on their boards' posts
CREATE POLICY "Org members can delete comments on their boards" ON comments
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM posts p
    JOIN boards b ON p.board_id = b.id
    JOIN org_members om ON b.org_id = om.org_id
    WHERE p.id = comments.post_id
    AND om.user_id = auth.uid()
  )
);

-- Allow org members to update comments on their boards' posts
CREATE POLICY "Org members can update comments on their boards" ON comments
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM posts p
    JOIN boards b ON p.board_id = b.id
    JOIN org_members om ON b.org_id = om.org_id
    WHERE p.id = comments.post_id
    AND om.user_id = auth.uid()
  )
);

-- Allow org members to delete posts on their boards
CREATE POLICY "Org members can delete posts on their boards" ON posts
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM boards b
    JOIN org_members om ON b.org_id = om.org_id
    WHERE b.id = posts.board_id
    AND om.user_id = auth.uid()
  )
);
