import { createHmac } from "node:crypto";
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
    for (const bind of devStore().wechatBindings.values()) {
      if (bind.provider === provider && bind.providerUserId === providerUserId) {
        return bind as unknown as WechatBinding;
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
      if (bind.userId === userId) return bind as unknown as WechatBinding;
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

/**
 * In-memory nonce dedup set (per-worker, resets on restart)
 */
const recentNonces = new Set<string>();
const NONCE_DEDUP_TTL_MS = 300_000; // 5 minutes

/**
 * Verify ClawBot webhook signature using HMAC-SHA256
 *
 * Headers:
 *   x-clawbot-timestamp  - Unix timestamp in seconds
 *   x-clawbot-nonce      - Random nonce string
 *   x-clawbot-signature  - HMAC-SHA256(timestamp + "." + nonce + "." + rawBody, secret)
 *
 * Requirements:
 * - timestamp must be within 5 minutes of current time
 * - nonce must not have been seen before (dedup for 5 min)
 * - signature must match computed HMAC
 * - CLAWBOT_MOCK=true bypasses signature check (local dev only)
 */
export function verifyClawbotSignature(
  request: Request,
  env: CloudflareBindings,
  bodyText: string,
): boolean {
  const secret = env.CLAWBOT_WEBHOOK_SECRET;
  const isMock = env.CLAWBOT_MOCK === "true";

  // Local dev bypass
  if (isMock && !secret) {
    return true;
  }

  const timestamp = request.headers.get("x-clawbot-timestamp");
  const nonce = request.headers.get("x-clawbot-nonce");
  const signature = request.headers.get("x-clawbot-signature");

  if (!timestamp || !nonce || !signature) {
    console.error("[ClawBot] Missing signature headers");
    return false;
  }

  // Validate timestamp (5 minute window)
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts)) {
    console.error("[ClawBot] Invalid timestamp");
    return false;
  }
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > 300) {
    console.error("[ClawBot] Timestamp expired or in future:", ts, "now:", now);
    return false;
  }

  // Check nonce dedup
  const dedupKey = `${nonce}:${timestamp}`;
  if (recentNonces.has(dedupKey)) {
    console.error("[ClawBot] Duplicate nonce detected:", nonce);
    return false;
  }
  recentNonces.add(dedupKey);
  // Cleanup old entries after TTL
  setTimeout(() => recentNonces.delete(dedupKey), NONCE_DEDUP_TTL_MS);

  // Compute expected signature
  const payload = `${timestamp}.${nonce}.${bodyText}`;
  const expected = createHmac("sha256", secret ?? "")
    .update(payload, "utf-8")
    .digest("hex");

  // Constant-time comparison to prevent timing attacks
  if (signature.length !== expected.length) return false;
  let match = 0;
  for (let i = 0; i < signature.length; i++) {
    match |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
  }

  if (match !== 0) {
    console.error("[ClawBot] Signature mismatch");
    return false;
  }

  return true;
}
