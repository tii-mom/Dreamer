import type { UserProfile } from "../domain";
import { getUser, devStore } from "./xms-store.server";

export type WechatBinding = {
  id: string;
  userId: string;
  provider: string;
  providerUserId: string;
  openid?: string | null;
  unionid?: string | null;
  nickname?: string | null;
  avatarUrl?: string | null;
  status: string;
  bindScene?: string | null;
  rawJson?: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function getBindingByProviderUser(
  env: CloudflareBindings,
  provider: string,
  providerUserId: string,
): Promise<WechatBinding | null> {
  const db = env.DB;
  if (!db) {
    // Local memory fallback
    for (const bind of devStore().wechatBindings.values()) {
      if (bind.provider === provider && bind.providerUserId === providerUserId) {
        return bind;
      }
    }
    return null;
  }

  const row = await db
    .prepare("SELECT * FROM wechat_bindings WHERE provider = ? AND provider_user_id = ? LIMIT 1")
    .bind(provider, providerUserId)
    .first<Record<string, string>>();

  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider,
    providerUserId: row.provider_user_id,
    openid: row.openid,
    unionid: row.unionid,
    nickname: row.nickname,
    avatarUrl: row.avatar_url,
    status: row.status,
    bindScene: row.bind_scene,
    rawJson: row.raw_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createWechatBinding(
  env: CloudflareBindings,
  binding: Omit<WechatBinding, "createdAt" | "updatedAt">,
): Promise<void> {
  const db = env.DB;
  const now = new Date().toISOString();

  if (!db) {
    devStore().wechatBindings.set(binding.id, {
      ...binding,
      createdAt: now,
      updatedAt: now,
    });
    return;
  }

  await db
    .prepare(
      `INSERT INTO wechat_bindings 
      (id, user_id, provider, provider_user_id, openid, unionid, nickname, avatar_url, status, bind_scene, raw_json, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      binding.id,
      binding.userId,
      binding.provider,
      binding.providerUserId,
      binding.openid || null,
      binding.unionid || null,
      binding.nickname || null,
      binding.avatarUrl || null,
      binding.status,
      binding.bindScene || null,
      binding.rawJson || null,
      now,
      now,
    )
    .run();
}

export async function getBindingByUserId(
  env: CloudflareBindings,
  userId: string,
): Promise<WechatBinding | null> {
  const db = env.DB;
  if (!db) {
    for (const bind of devStore().wechatBindings.values()) {
      if (bind.userId === userId) return bind;
    }
    return null;
  }

  const row = await db
    .prepare("SELECT * FROM wechat_bindings WHERE user_id = ? LIMIT 1")
    .bind(userId)
    .first<Record<string, string>>();

  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider,
    providerUserId: row.provider_user_id,
    openid: row.openid,
    unionid: row.unionid,
    nickname: row.nickname,
    avatarUrl: row.avatar_url,
    status: row.status,
    bindScene: row.bind_scene,
    rawJson: row.raw_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function verifyClawbotSignature(
  request: Request,
  env: CloudflareBindings,
  bodyText: string,
): boolean {
  const secret = env.CLAWBOT_WEBHOOK_SECRET || "MOCK_CLAWBOT_SECRET";
  const signature = request.headers.get("x-clawbot-signature");

  // If secret signature is not provided or set to mock, bypass for testing ease
  if (secret === "MOCK_CLAWBOT_SECRET" && !signature) {
    return true;
  }

  if (!signature) return false;

  // Simple check for ClawBot payload signature
  return signature === secret;
}
