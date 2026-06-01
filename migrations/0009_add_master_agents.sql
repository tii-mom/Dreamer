CREATE TABLE IF NOT EXISTS master_agents (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  active_asset_id TEXT,
  agent_code TEXT NOT NULL,
  display_name TEXT NOT NULL,
  persona_json TEXT NOT NULL,
  constraints_json TEXT NOT NULL,
  skills_json TEXT NOT NULL,
  memory_policy_json TEXT NOT NULL,
  entitlement_json TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_master_agents_owner_user_id ON master_agents(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_master_agents_status ON master_agents(status);
CREATE INDEX IF NOT EXISTS idx_master_agents_agent_code ON master_agents(agent_code);

CREATE TABLE IF NOT EXISTS master_agent_memories (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  memory_type TEXT NOT NULL,
  content TEXT NOT NULL,
  importance INTEGER NOT NULL DEFAULT 1,
  source_message_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(agent_id) REFERENCES master_agents(id) ON DELETE CASCADE,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_master_agent_memories_agent_id ON master_agent_memories(agent_id);
CREATE INDEX IF NOT EXISTS idx_master_agent_memories_user_id ON master_agent_memories(user_id);

CREATE TABLE IF NOT EXISTS master_agent_skill_states (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  skill_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'enabled',
  level INTEGER NOT NULL DEFAULT 1,
  source TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(agent_id) REFERENCES master_agents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_master_agent_skill_states_agent_id ON master_agent_skill_states(agent_id);
CREATE INDEX IF NOT EXISTS idx_master_agent_skill_states_skill_code ON master_agent_skill_states(skill_code);
