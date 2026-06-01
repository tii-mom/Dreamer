CREATE TABLE IF NOT EXISTS bot_bind_tickets (
  id TEXT PRIMARY KEY,
  ticket TEXT NOT NULL UNIQUE,
  bind_code TEXT NOT NULL UNIQUE,
  user_id TEXT,
  operator_user_id TEXT,
  referral_code TEXT,
  master_asset_id TEXT,
  scene TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'clawbot',
  provider_user_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TEXT NOT NULL,
  bound_at TEXT,
  raw_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bot_bind_tickets_ticket ON bot_bind_tickets(ticket);
CREATE INDEX IF NOT EXISTS idx_bot_bind_tickets_bind_code ON bot_bind_tickets(bind_code);
CREATE INDEX IF NOT EXISTS idx_bot_bind_tickets_user_id ON bot_bind_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_bind_tickets_referral_code ON bot_bind_tickets(referral_code);
CREATE INDEX IF NOT EXISTS idx_bot_bind_tickets_provider_user_id ON bot_bind_tickets(provider_user_id);
CREATE INDEX IF NOT EXISTS idx_bot_bind_tickets_status ON bot_bind_tickets(status);
