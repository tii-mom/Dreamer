-- Migration 0007: Add birth_charts table for structured Ziwei charts

CREATE TABLE IF NOT EXISTS birth_charts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  birth_profile_json TEXT NOT NULL,
  chart_json TEXT NOT NULL,
  chart_summary_json TEXT,
  chart_version TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_birth_charts_user_id ON birth_charts(user_id);
CREATE INDEX IF NOT EXISTS idx_birth_charts_version ON birth_charts(chart_version);
