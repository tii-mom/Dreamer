-- Migration 0004_wechat_operator_tables

-- 6.1 微信绑定表
CREATE TABLE IF NOT EXISTS wechat_bindings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'clawbot',
  provider_user_id TEXT NOT NULL UNIQUE,
  openid TEXT,
  unionid TEXT,
  nickname TEXT,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  bind_scene TEXT,
  raw_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_wechat_bindings_user ON wechat_bindings(user_id);
CREATE INDEX IF NOT EXISTS idx_wechat_bindings_provider_user ON wechat_bindings(provider_user_id);

-- 6.2 机器人消息表
CREATE TABLE IF NOT EXISTS bot_messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  binding_id TEXT,
  channel TEXT NOT NULL DEFAULT 'clawbot',
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  message_type TEXT NOT NULL DEFAULT 'text',
  content TEXT,
  intent TEXT,
  raw_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_bot_messages_user_time ON bot_messages(user_id, created_at);

-- 6.3 经营者表
CREATE TABLE IF NOT EXISTS operators (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'operator_899',
  status TEXT NOT NULL DEFAULT 'inactive',
  shop_name TEXT,
  referral_code TEXT NOT NULL UNIQUE,
  subscribed_until TEXT,
  total_invites INTEGER NOT NULL DEFAULT 0,
  total_conversions INTEGER NOT NULL DEFAULT 0,
  total_paid_cents INTEGER NOT NULL DEFAULT 0,
  incense_value INTEGER NOT NULL DEFAULT 0,
  risk_status TEXT NOT NULL DEFAULT 'normal',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_operators_referral_code ON operators(referral_code);
CREATE INDEX IF NOT EXISTS idx_operators_status ON operators(status);

-- 6.4 经营者归因表
CREATE TABLE IF NOT EXISTS operator_referrals (
  id TEXT PRIMARY KEY,
  operator_user_id TEXT NOT NULL,
  invitee_user_id TEXT,
  referral_code TEXT NOT NULL,
  source_scene TEXT,
  first_touch_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  converted_at TEXT,
  first_payment_id TEXT,
  total_paid_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'visited',
  ip_hash TEXT,
  ua_hash TEXT
);
CREATE INDEX IF NOT EXISTS idx_operator_referrals_operator ON operator_referrals(operator_user_id);
CREATE INDEX IF NOT EXISTS idx_operator_referrals_invitee ON operator_referrals(invitee_user_id);
CREATE INDEX IF NOT EXISTS idx_operator_referrals_code ON operator_referrals(referral_code);

-- 6.6 用户资产表
CREATE TABLE IF NOT EXISTS user_assets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('master', 'inscription', 'skin', 'ticket', 'frame')),
  asset_code TEXT NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'normal',
  quantity INTEGER NOT NULL DEFAULT 1,
  level INTEGER NOT NULL DEFAULT 1,
  locked INTEGER NOT NULL DEFAULT 0,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_user_assets_user_type ON user_assets(user_id, asset_type);

-- 6.7 铭文装配表
CREATE TABLE IF NOT EXISTS inscription_equips (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  slot_index INTEGER NOT NULL,
  bot_scope TEXT NOT NULL DEFAULT 'default',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, slot_index, bot_scope)
);

-- 6.8 盲盒抽卡表
CREATE TABLE IF NOT EXISTS blindbox_draws (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  payment_id TEXT,
  box_type TEXT NOT NULL,
  draw_count INTEGER NOT NULL DEFAULT 1,
  probability_version TEXT NOT NULL,
  result_json TEXT NOT NULL,
  referral_code TEXT,
  operator_user_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_blindbox_draws_user ON blindbox_draws(user_id);
CREATE INDEX IF NOT EXISTS idx_blindbox_draws_operator ON blindbox_draws(operator_user_id);

-- 6.9 奖励流水表
CREATE TABLE IF NOT EXISTS reward_ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  reward_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  source_id TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_reward_ledger_user ON reward_ledger(user_id);
