-- Allow deleting votes (needed for public vote toggling)
CREATE POLICY "Anyone can delete votes" ON votes
  FOR DELETE USING (true);
