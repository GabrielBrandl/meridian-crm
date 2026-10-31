export const SCHEMA_VERSION = 2;

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS schema_meta (
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'starter',
  status TEXT NOT NULL DEFAULT 'active',
  owner_name TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  phone TEXT,
  daily_limit INTEGER NOT NULL DEFAULT 250,
  user_limit INTEGER NOT NULL DEFAULT 3,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  approved_at TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  tenant_id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  n8n_webhook_url TEXT NOT NULL DEFAULT '',
  n8n_secret TEXT NOT NULL DEFAULT '',
  n8n_callback_secret TEXT NOT NULL DEFAULT '',
  sandbox_mode INTEGER NOT NULL DEFAULT 1,
  messages_per_minute INTEGER NOT NULL DEFAULT 12,
  daily_limit INTEGER NOT NULL DEFAULT 250,
  min_interval_seconds INTEGER NOT NULL DEFAULT 4,
  jitter_seconds INTEGER NOT NULL DEFAULT 3,
  business_hours_start TEXT NOT NULL DEFAULT '08:00',
  business_hours_end TEXT NOT NULL DEFAULT '20:00',
  timezone TEXT NOT NULL DEFAULT 'America/Manaus',
  opt_out_keywords TEXT NOT NULL DEFAULT 'sair,parar,stop,cancelar,descadastrar',
  pause_error_rate INTEGER NOT NULL DEFAULT 25,
  require_opt_in INTEGER NOT NULL DEFAULT 1,
  test_phone TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS connections (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'evolution',
  status TEXT NOT NULL DEFAULT 'idle',
  instance_name TEXT NOT NULL DEFAULT '',
  phone_number TEXT,
  qr_code TEXT,
  last_checked_at TEXT,
  notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  company TEXT,
  city TEXT,
  notes TEXT,
  opt_in INTEGER NOT NULL DEFAULT 1,
  opted_out_at TEXT,
  blocked INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'manual',
  last_inbound_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contact_tags (
  contact_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (contact_id, tag_id)
);

CREATE TABLE IF NOT EXISTS pipeline_stages (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  position INTEGER NOT NULL,
  is_won INTEGER NOT NULL DEFAULT 0,
  is_lost INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pipeline_cards (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  stage_id TEXT NOT NULL,
  value_cents INTEGER NOT NULL DEFAULT 0,
  title TEXT
);

CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'marketing',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  template_id TEXT,
  connection_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_at TEXT,
  started_at TEXT,
  finished_at TEXT,
  tag_ids TEXT NOT NULL DEFAULT '[]',
  stage_id TEXT,
  only_opt_in INTEGER NOT NULL DEFAULT 1,
  test_mode INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS campaign_recipients (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  phone TEXT NOT NULL,
  rendered_message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  provider_id TEXT,
  error TEXT,
  sent_at TEXT,
  delivered_at TEXT,
  read_at TEXT,
  replied_at TEXT
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  unread INTEGER NOT NULL DEFAULT 0,
  last_message TEXT,
  last_at TEXT
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  direction TEXT NOT NULL,
  body TEXT NOT NULL,
  campaign_id TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contacts_tenant_phone ON contacts (tenant_id, phone);
CREATE INDEX IF NOT EXISTS idx_campaigns_tenant ON campaigns (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_recipients_campaign_status ON campaign_recipients (campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_connections_instance ON connections (instance_name);
`;
