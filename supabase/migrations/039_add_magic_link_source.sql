-- Add 'magic_link' to widget_users user_source constraint
ALTER TABLE widget_users DROP CONSTRAINT IF EXISTS widget_users_user_source_check;
ALTER TABLE widget_users ADD CONSTRAINT widget_users_user_source_check
  CHECK (user_source IN ('guest', 'social_google', 'social_github', 'identified', 'verified_jwt', 'magic_link'));
