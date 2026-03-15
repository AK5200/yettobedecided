-- Add missing DELETE policy for changelog_entries
CREATE POLICY "Org members can delete changelog" ON changelog_entries
  FOR DELETE USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );
