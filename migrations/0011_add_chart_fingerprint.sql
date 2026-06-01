ALTER TABLE past_life_results ADD COLUMN chart_fingerprint TEXT;

CREATE INDEX IF NOT EXISTS idx_past_life_results_fingerprint ON past_life_results(user_id, chart_fingerprint);
