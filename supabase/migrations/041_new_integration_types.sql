-- Update integrations table to allow new types: teams, telegram, webhook
ALTER TABLE integrations DROP CONSTRAINT IF EXISTS integrations_type_check;
ALTER TABLE integrations ADD CONSTRAINT integrations_type_check
  CHECK (type IN ('slack', 'discord', 'teams', 'telegram', 'webhook'));
