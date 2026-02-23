-- Rename login_handler value from 'feedbackhub' to 'kelo' (brand rename)
-- Drop old constraint, update existing rows, add new constraint

ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_login_handler_check;

UPDATE organizations SET login_handler = 'kelo' WHERE login_handler = 'feedbackhub';

ALTER TABLE organizations ADD CONSTRAINT organizations_login_handler_check
  CHECK (login_handler IN ('kelo', 'customer'));
