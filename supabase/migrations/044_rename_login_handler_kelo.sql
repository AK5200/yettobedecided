-- Rename login_handler value from 'feedbackhub' to 'kelo' (brand rename)
-- Drop old constraint, update existing rows, add new constraint

ALTER TABLE sso_settings DROP CONSTRAINT IF EXISTS sso_settings_login_handler_check;

UPDATE sso_settings SET login_handler = 'kelo' WHERE login_handler = 'feedbackhub';

ALTER TABLE sso_settings ADD CONSTRAINT sso_settings_login_handler_check
  CHECK (login_handler IN ('kelo', 'customer'));
