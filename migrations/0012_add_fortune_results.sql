CREATE TABLE IF NOT EXISTS fortune_results (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  html TEXT,
  data_json TEXT NOT NULL,
  share_token TEXT UNIQUE,
  source_chart_id TEXT,
  model TEXT,
  token_estimate INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fortune_results_user_kind_created ON fortune_results(user_id, kind, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fortune_results_share_token ON fortune_results(share_token);

CREATE TABLE IF NOT EXISTS fortune_daily_cache (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date_key TEXT NOT NULL,
  kernel_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, date_key)
);
