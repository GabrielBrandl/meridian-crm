export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string | null;
  tenantName?: string | null;
};

export type Settings = {
  tenant_id: string;
  company_name: string;
  n8n_webhook_url: string;
  n8n_secret: string;
  n8n_callback_secret: string;
  sandbox_mode: number;
  messages_per_minute: number;
  daily_limit: number;
  min_interval_seconds: number;
  jitter_seconds: number;
  business_hours_start: string;
  business_hours_end: string;
  timezone: string;
  opt_out_keywords: string;
  pause_error_rate: number;
  require_opt_in: number;
  test_phone: string;
};

export type Contact = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  city: string | null;
  notes: string | null;
  opt_in: number;
  opted_out_at: string | null;
  blocked: number;
  source: string;
  last_inbound_at: string | null;
  created_at: string;
  updated_at: string;
  tags?: string;
  stage_id?: string | null;
  stage_name?: string | null;
};

export type Campaign = {
  id: string;
  name: string;
  message: string;
  template_id: string | null;
  connection_id: string | null;
  status: string;
  scheduled_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  tag_ids: string;
  stage_id: string | null;
  only_opt_in: number;
  test_mode: number;
  created_at: string;
  updated_at: string;
};

export type Recipient = {
  id: string;
  campaign_id: string;
  contact_id: string;
  phone: string;
  rendered_message: string;
  status: string;
  provider_id: string | null;
  error: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  replied_at: string | null;
  name?: string;
};
