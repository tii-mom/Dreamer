CREATE TABLE IF NOT EXISTS past_life_results (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  chart_id TEXT,
  preset_id TEXT NOT NULL,
  title TEXT NOT NULL,
  rarity TEXT NOT NULL,
  result_json TEXT NOT NULL,
  share_token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_past_life_results_user_id ON past_life_results(user_id);
CREATE INDEX IF NOT EXISTS idx_past_life_results_share_token ON past_life_results(share_token);
CREATE INDEX IF NOT EXISTS idx_past_life_results_preset_id ON past_life_results(preset_id);
CREATE INDEX IF NOT EXISTS idx_past_life_results_rarity ON past_life_results(rarity);
