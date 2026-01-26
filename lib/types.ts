export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_new_post: boolean;
  email_status_change: boolean;
  email_new_comment: boolean;
  email_new_vote: boolean;
  email_post_merged: boolean;
}

export interface LinearIntegration {
  id: string;
  org_id: string;
  access_token: string;
  team_id: string | null;
  team_name: string | null;
  connected_by_id: string;
  created_at: string;
}
