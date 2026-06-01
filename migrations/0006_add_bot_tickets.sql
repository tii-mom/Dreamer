-- Migration 0006: Add bot_tickets table for H5 secure access

CREATE TABLE IF NOT EXISTS bot_tickets (
  id TEXT PRIMARY KEY,
  ticket TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_user_id TEXT,
  scene TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bot_tickets_ticket ON bot_tickets(ticket);
CREATE INDEX IF NOT EXISTS idx_bot_tickets_user ON bot_tickets(user_id);
