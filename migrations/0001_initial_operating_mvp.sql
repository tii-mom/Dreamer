CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  recovery_code TEXT NOT NULL UNIQUE,
  nickname TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT '见习命师',
  qiyun INTEGER NOT NULL DEFAULT 1280,
  wallet REAL NOT NULL DEFAULT 66.6,
  streak INTEGER NOT NULL DEFAULT 0,
  asks_today INTEGER NOT NULL DEFAULT 0,
  asks_max INTEGER NOT NULL DEFAULT 1,
  seal_unlocked INTEGER NOT NULL DEFAULT 30,
  chart_glow INTEGER NOT NULL DEFAULT 30,
  subscribed INTEGER NOT NULL DEFAULT 0,
  shop_open INTEGER NOT NULL DEFAULT 0,
  unread INTEGER NOT NULL DEFAULT 7,
  last_checkin_date TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS birth_profiles (
  user_id TEXT PRIMARY KEY,
  calendar_type TEXT NOT NULL DEFAULT 'solar',
  birth_date TEXT NOT NULL,
  birth_time TEXT,
  gender TEXT,
  raw_text TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS threads (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  type TEXT NOT NULL,
  text TEXT,
  card_kind TEXT,
  card_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS daily_states (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date_key TEXT NOT NULL,
  checked_in INTEGER NOT NULL DEFAULT 0,
  asks_used INTEGER NOT NULL DEFAULT 0,
  tasks_json TEXT NOT NULL,
  fortune_json TEXT NOT NULL,
  chart_glow INTEGER NOT NULL DEFAULT 30,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date_key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS share_assets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  url TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS invites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  uses INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS earn_applications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  offer TEXT NOT NULL,
  audience TEXT NOT NULL,
  price_range TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_call_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  thread_id TEXT,
  model TEXT NOT NULL,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  status TEXT NOT NULL,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL,
  props_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_threads_user_id ON threads(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_created ON messages(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_daily_states_user_date ON daily_states(user_id, date_key);
CREATE INDEX IF NOT EXISTS idx_share_assets_user_kind ON share_assets(user_id, kind);
CREATE INDEX IF NOT EXISTS idx_earn_applications_user_status ON earn_applications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_call_logs_user_created ON ai_call_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_events_name_created ON events(name, created_at);
