-- Migration: Add payments table for BufPay tracking
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  order_id TEXT NOT NULL UNIQUE,
  aoid TEXT UNIQUE,
  product_code TEXT NOT NULL,
  item_name TEXT NOT NULL,
  pay_type TEXT NOT NULL CHECK (pay_type IN ('alipay', 'wechat')),
  price_cents INTEGER NOT NULL,
  display_price TEXT NOT NULL,
  pay_price_cents INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  entitlement_applied INTEGER NOT NULL DEFAULT 0,
  qr TEXT,
  qr_img TEXT,
  qr_price TEXT,
  expires_at TEXT,
  callback_raw_json TEXT,
  provider_raw_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payments_user_status ON payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_aoid ON payments(aoid);
