-- Create banned_emails table for spam control
CREATE TABLE banned_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  reason TEXT,
  banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  banned_by UUID REFERENCES auth.users(id),
  UNIQUE(org_id, email)
);

-- Create index for fast lookups
CREATE INDEX idx_banned_emails_org_id ON banned_emails(org_id);
CREATE INDEX idx_banned_emails_email ON banned_emails(email);
CREATE INDEX idx_banned_emails_org_email ON banned_emails(org_id, email);

-- Enable Row Level Security
ALTER TABLE banned_emails ENABLE ROW LEVEL SECURITY;

-- RLS Policies for banned_emails
CREATE POLICY "Org members can view banned emails" ON banned_emails
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Org members can insert banned emails" ON banned_emails
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Org members can delete banned emails" ON banned_emails
  FOR DELETE USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

-- Function to check if an email is banned for an org
CREATE OR REPLACE FUNCTION is_email_banned(check_email TEXT, check_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM banned_emails
    WHERE org_id = check_org_id
    AND LOWER(email) = LOWER(check_email)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
