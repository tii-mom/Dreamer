import {
  DEFAULT_MASTER_AGENT_PRESET,
  type MasterAgentPreset,
} from "../agents/master-agent-presets";
import { devStore, nowIso, randomId } from "./xms-store.server";

export type MasterAgentRecord = {
  id: string;
  ownerUserId: string;
  activeAssetId?: string | null;
  agentCode: string;
  displayName: string;
  persona: MasterAgentPreset["persona"];
  constraints: MasterAgentPreset["constraints"];
  skills: string[];
  memoryPolicy: MasterAgentPreset["memoryPolicy"];
  entitlement?: Record<string, unknown> | null;
  status: "active" | "paused";
  createdAt: string;
  updatedAt: string;
};

export type MasterAgentMemory = {
  id: string;
  agentId: string;
  userId: string;
  memoryType: string;
  content: string;
  importance: number;
  sourceMessageId?: string | null;
  createdAt: string;
  updatedAt: string;
};

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function mapAgent(row: Record<string, unknown>): MasterAgentRecord {
  return {
    id: String(row.id),
    ownerUserId: String(row.owner_user_id),
    activeAssetId: row.active_asset_id ? String(row.active_asset_id) : null,
    agentCode: String(row.agent_code),
    displayName: String(row.display_name),
    persona: parseJson(row.persona_json, DEFAULT_MASTER_AGENT_PRESET.persona),
    constraints: parseJson(row.constraints_json, DEFAULT_MASTER_AGENT_PRESET.constraints),
    skills: parseJson(row.skills_json, DEFAULT_MASTER_AGENT_PRESET.skills),
    memoryPolicy: parseJson(row.memory_policy_json, DEFAULT_MASTER_AGENT_PRESET.memoryPolicy),
    entitlement: parseJson(row.entitlement_json, null),
    status: String(row.status) === "paused" ? "paused" : "active",
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapMemory(row: Record<string, unknown>): MasterAgentMemory {
  return {
    id: String(row.id),
    agentId: String(row.agent_id),
    userId: String(row.user_id),
    memoryType: String(row.memory_type),
    content: String(row.content),
    importance: Number(row.importance ?? 1),
    sourceMessageId: row.source_message_id ? String(row.source_message_id) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function createDefaultAgent(userId: string): MasterAgentRecord {
  const now = nowIso();
  return {
    id: randomId("agent"),
    ownerUserId: userId,
    activeAssetId: null,
    agentCode: DEFAULT_MASTER_AGENT_PRESET.agentCode,
    displayName: DEFAULT_MASTER_AGENT_PRESET.displayName,
    persona: DEFAULT_MASTER_AGENT_PRESET.persona,
    constraints: DEFAULT_MASTER_AGENT_PRESET.constraints,
    skills: DEFAULT_MASTER_AGENT_PRESET.skills,
    memoryPolicy: DEFAULT_MASTER_AGENT_PRESET.memoryPolicy,
    entitlement: null,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
}

export async function getOrCreateActiveMasterAgent(
  env: CloudflareBindings,
  userId: string,
): Promise<MasterAgentRecord> {
  if (!env.DB) {
    const store = devStore();
    const existing = store.masterAgents.get(userId) as MasterAgentRecord | undefined;
    if (existing) return existing;
    const agent = createDefaultAgent(userId);
    store.masterAgents.set(userId, agent);
    return agent;
  }

  const row = await env.DB.prepare(
    "SELECT * FROM master_agents WHERE owner_user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1",
  )
    .bind(userId)
    .first<Record<string, unknown>>();

  if (row) return mapAgent(row);

  const agent = createDefaultAgent(userId);
  await env.DB.prepare(
    `INSERT INTO master_agents
      (id, owner_user_id, active_asset_id, agent_code, display_name, persona_json, constraints_json, skills_json, memory_policy_json, entitlement_json, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      agent.id,
      agent.ownerUserId,
      agent.activeAssetId ?? null,
      agent.agentCode,
      agent.displayName,
      JSON.stringify(agent.persona),
      JSON.stringify(agent.constraints),
      JSON.stringify(agent.skills),
      JSON.stringify(agent.memoryPolicy),
      agent.entitlement ? JSON.stringify(agent.entitlement) : null,
      agent.status,
      agent.createdAt,
      agent.updatedAt,
    )
    .run();
  return agent;
}

export async function getMasterAgentMemories(
  env: CloudflareBindings,
  agentId: string,
  userId: string,
): Promise<MasterAgentMemory[]> {
  if (!env.DB) {
    return Array.from(devStore().masterAgentMemories.values())
      .filter((memory) => memory.agentId === agentId && memory.userId === userId)
      .sort((a, b) => b.importance - a.importance || b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8);
  }

  const rows = await env.DB.prepare(
    `SELECT * FROM master_agent_memories
     WHERE agent_id = ? AND user_id = ?
     ORDER BY importance DESC, created_at DESC
     LIMIT 8`,
  )
    .bind(agentId, userId)
    .all<Record<string, unknown>>();
  return (rows.results ?? []).map(mapMemory);
}
