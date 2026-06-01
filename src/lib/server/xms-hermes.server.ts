import { createHmac } from "node:crypto";
import type { ChatMsg, UserProfile } from "../domain";
import { generateMasterReply } from "./xms-ai.server";
import { getOrCreateUserChart } from "./xms-chart.server";
import { getBindTicketByCode, type BotBindTicket } from "./xms-bind-ticket.server";
import {
  addMessage,
  createUser,
  devStore,
  getBirthProfile,
  getMessages,
  getOrCreateDailyState,
  getOrCreateThread,
  getUser,
  nowIso,
  randomId,
  updateUser,
} from "./xms-store.server";
import {
  createWechatBinding,
  getBindingByProviderUser,
  getBindingByUserId,
  type WechatBinding,
} from "./xms-wechat.server";
import {
  getMasterAgentMemories,
  getOrCreateActiveMasterAgent,
  type MasterAgentRecord,
} from "./xms-master-agent.server";

const HERMES_PROVIDER = "hermes-weixin";
const HERMES_SIGNATURE_TTL_SECONDS = 300;

type HermesPayload = {
  provider?: string;
  providerUserId?: string;
  userId?: string;
  text?: string;
  message?: string;
  bindCode?: string;
  scene?: string;
  nickname?: string;
  avatarUrl?: string;
  rawPayload?: unknown;
  metadata?: Record<string, unknown>;
};

type HermesEntitlement = {
  enabled: boolean;
  reason?: string;
  asksRemaining: number;
  subscribed: boolean;
  subscriptionPlan?: string | null;
  subscribedUntil?: string | null;
  qiyun: number;
  allowedTools: string[];
  deniedTools: string[];
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function verifyHermesSignature(request: Request, env: CloudflareBindings, bodyText: string): boolean {
  const isMock = env.HERMES_MOCK === "true";
  const secret = env.HERMES_WEBHOOK_SECRET;

  if (isMock && !secret) return true;
  if (!secret) {
    console.error("[Hermes] HERMES_WEBHOOK_SECRET is not configured");
    return false;
  }

  const timestamp = request.headers.get("x-hermes-timestamp");
  const nonce = request.headers.get("x-hermes-nonce");
  const signature = request.headers.get("x-hermes-signature");
  if (!timestamp || !nonce || !signature) {
    console.error("[Hermes] Missing signature headers");
    return false;
  }

  const ts = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(ts)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > HERMES_SIGNATURE_TTL_SECONDS) {
    console.error("[Hermes] Signature timestamp outside TTL", { ts, now });
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${nonce}.${bodyText}`, "utf-8")
    .digest("hex");

  return timingSafeEqualHex(signature, expected);
}

async function readSignedPayload(request: Request, env: CloudflareBindings): Promise<HermesPayload | Response> {
  const bodyText = await request.text();
  if (!verifyHermesSignature(request, env, bodyText)) {
    return json({ ok: false, error: "Unauthorized" }, 401);
  }

  try {
    return JSON.parse(bodyText || "{}") as HermesPayload;
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400);
  }
}

function normalizeProviderUserId(payload: HermesPayload): string | null {
  const value = payload.providerUserId ?? payload.metadata?.providerUserId;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeText(payload: HermesPayload): string {
  return String(payload.text ?? payload.message ?? "").trim();
}

function extractBindCode(payload: HermesPayload, text: string): string | null {
  if (payload.bindCode) return payload.bindCode.trim().toUpperCase();
  const match = text.match(/(?:绑定|bind|起运)\s*([A-Z0-9]{6,12})/i);
  return match?.[1]?.toUpperCase() ?? null;
}

async function markTicketBound(
  env: CloudflareBindings,
  ticket: BotBindTicket,
  providerUserId: string,
): Promise<void> {
  const boundAt = nowIso();
  if (!env.DB) {
    const stored = devStore().botBindTickets.get(ticket.id) as unknown as BotBindTicket | undefined;
    const next = {
      ...(stored ?? ticket),
      status: "bound" as const,
      providerUserId,
      boundAt,
      rawJson: `${stored?.rawJson ?? ticket.rawJson ?? ""}|hermes_bound:${providerUserId}`,
    };
    devStore().botBindTickets.set(next.id, next as unknown as Record<string, unknown>);
    devStore().botBindTickets.set(`code:${next.bindCode}`, next as unknown as Record<string, unknown>);
    devStore().botBindTickets.set(`ticket:${next.ticket}`, next as unknown as Record<string, unknown>);
    return;
  }

  await env.DB.prepare(
    "UPDATE bot_bind_tickets SET status = 'bound', provider = ?, provider_user_id = ?, bound_at = ?, updated_at = (datetime('now')) WHERE id = ?",
  )
    .bind(HERMES_PROVIDER, providerUserId, boundAt, ticket.id)
    .run();
}

async function bindHermesUserByCode(
  env: CloudflareBindings,
  input: {
    bindCode: string;
    providerUserId: string;
    nickname?: string | null;
    avatarUrl?: string | null;
    rawPayload?: unknown;
  },
): Promise<{ ok: boolean; reason?: string; userId?: string; binding?: WechatBinding }> {
  const ticket = await getBindTicketByCode(env, input.bindCode);
  if (!ticket) return { ok: false, reason: "绑定码无效" };
  if (new Date(ticket.expiresAt).getTime() < Date.now()) return { ok: false, reason: "绑定码已过期" };
  if (ticket.status !== "pending" && ticket.status !== "bound") {
    return { ok: false, reason: "绑定码已失效" };
  }
  if (!ticket.userId) return { ok: false, reason: "绑定票缺少用户信息，请回到网页重新生成绑定码" };

  const existing = await getBindingByProviderUser(env, HERMES_PROVIDER, input.providerUserId);
  if (existing) {
    if (existing.userId !== ticket.userId) {
      return { ok: false, reason: "该微信已绑定其他戏命师账户，请联系客服处理" };
    }
    await markTicketBound(env, ticket, input.providerUserId);
    return { ok: true, userId: existing.userId, binding: existing };
  }

  const binding: Omit<WechatBinding, "createdAt" | "updatedAt"> = {
    id: randomId("bin"),
    userId: ticket.userId,
    provider: HERMES_PROVIDER,
    providerUserId: input.providerUserId,
    nickname: input.nickname ?? null,
    avatarUrl: input.avatarUrl ?? null,
    status: "active",
    bindScene: ticket.scene || "hermes-bind",
    rawJson: JSON.stringify({ ticketId: ticket.id, bindCode: input.bindCode, rawPayload: input.rawPayload }),
  };

  await createWechatBinding(env, binding);
  await markTicketBound(env, ticket, input.providerUserId);
  const saved = await getBindingByProviderUser(env, HERMES_PROVIDER, input.providerUserId);
  return { ok: true, userId: ticket.userId, binding: saved ?? ({ ...binding, createdAt: nowIso(), updatedAt: nowIso() } as WechatBinding) };
}

async function getOrAutoBindHermesUser(
  env: CloudflareBindings,
  providerUserId: string,
  payload: HermesPayload,
): Promise<{ user: UserProfile; binding: WechatBinding; created: boolean }> {
  const existing = await getBindingByProviderUser(env, HERMES_PROVIDER, providerUserId);
  if (existing) {
    const user = await getUser(env, existing.userId);
    if (user) return { user, binding: existing, created: false };
  }

  const user = await createUser(env, {
    nickname: payload.nickname ? `微信_${payload.nickname}` : `微信道友_${providerUserId.slice(-4)}`,
    source: HERMES_PROVIDER,
  });

  const binding: Omit<WechatBinding, "createdAt" | "updatedAt"> = {
    id: randomId("bin"),
    userId: user.id,
    provider: HERMES_PROVIDER,
    providerUserId,
    nickname: payload.nickname ?? null,
    avatarUrl: payload.avatarUrl ?? null,
    status: "active",
    bindScene: payload.scene ?? "hermes-auto",
    rawJson: JSON.stringify({ rawPayload: payload.rawPayload ?? payload }),
  };
  await createWechatBinding(env, binding);
  const saved = await getBindingByProviderUser(env, HERMES_PROVIDER, providerUserId);
  return {
    user,
    binding: saved ?? ({ ...binding, createdAt: nowIso(), updatedAt: nowIso() } as WechatBinding),
    created: true,
  };
}

function buildEntitlement(user: UserProfile): HermesEntitlement {
  const asksRemaining = Math.max(0, user.asksMax - user.asksToday);
  const enabled = user.subscribed || asksRemaining > 0 || user.qiyun > 0;
  return {
    enabled,
    reason: enabled ? undefined : "需要订阅或购买 token 后继续唤醒戏命师。",
    asksRemaining,
    subscribed: user.subscribed,
    subscriptionPlan: user.subscriptionPlan ?? null,
    subscribedUntil: user.subscribedUntil ?? null,
    qiyun: user.qiyun,
    allowedTools: ["xms_chat", "xms_ziwei", "xms_memory", "xms_daily_summary", "web_search"],
    deniedTools: [
      "terminal",
      "shell",
      "process",
      "read_file",
      "write_file",
      "patch_file",
      "model_config",
      "env_inspect",
      "secret_export",
      "server_admin",
    ],
  };
}

function memoryPaths(userId: string) {
  const shard = userId.slice(-2).padStart(2, "0");
  return {
    core: "/opt/xms-hermes/core",
    skills: "/opt/xms-hermes/skills",
    userRoot: `/opt/xms-hermes/users/shard-${shard}/${userId}`,
    userMemory: `/opt/xms-hermes/users/shard-${shard}/${userId}/MEMORY.md`,
    userProfile: `/opt/xms-hermes/users/shard-${shard}/${userId}/USER.md`,
  };
}

async function buildAgentState(env: CloudflareBindings, user: UserProfile, binding?: WechatBinding | null) {
  const agent = await getOrCreateActiveMasterAgent(env, user.id);
  const memories = await getMasterAgentMemories(env, agent.id, user.id);
  return {
    userId: user.id,
    provider: binding?.provider ?? HERMES_PROVIDER,
    providerUserId: binding?.providerUserId ?? null,
    agent: {
      id: agent.id,
      displayName: agent.displayName,
      agentCode: agent.agentCode,
      status: agent.status,
      skills: agent.skills,
      memoryPolicy: agent.memoryPolicy,
    },
    memories: memories.map((memory) => ({
      id: memory.id,
      memoryType: memory.memoryType,
      content: memory.content,
      importance: memory.importance,
      updatedAt: memory.updatedAt,
    })),
    memoryPaths: memoryPaths(user.id),
    entitlement: buildEntitlement(user),
  };
}

async function resolveHermesUser(env: CloudflareBindings, payload: HermesPayload) {
  if (payload.userId) {
    const user = await getUser(env, payload.userId);
    if (!user) return null;
    return { user, binding: await getBindingByUserId(env, user.id) };
  }

  const providerUserId = normalizeProviderUserId(payload);
  if (!providerUserId) return null;
  const binding = await getBindingByProviderUser(env, HERMES_PROVIDER, providerUserId);
  if (!binding) return null;
  const user = await getUser(env, binding.userId);
  return user ? { user, binding } : null;
}

export async function handleHermesWeixinBind(request: Request, env: CloudflareBindings): Promise<Response> {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const payload = await readSignedPayload(request, env);
  if (payload instanceof Response) return payload;

  const providerUserId = normalizeProviderUserId(payload);
  const bindCode = extractBindCode(payload, normalizeText(payload));
  if (!providerUserId) return json({ ok: false, error: "Missing providerUserId" }, 400);
  if (!bindCode) return json({ ok: false, error: "Missing bindCode" }, 400);

  const result = await bindHermesUserByCode(env, {
    bindCode,
    providerUserId,
    nickname: payload.nickname ?? null,
    avatarUrl: payload.avatarUrl ?? null,
    rawPayload: payload.rawPayload ?? payload,
  });

  if (!result.ok || !result.userId) {
    return json({ ok: false, error: result.reason ?? "Bind failed" }, 400);
  }

  const user = await getUser(env, result.userId);
  if (!user) return json({ ok: false, error: "User not found after bind" }, 500);
  await getOrCreateActiveMasterAgent(env, user.id);

  return json({
    ok: true,
    userId: user.id,
    bindingId: result.binding?.id ?? null,
    reply: "绑定成功。戏命师已入驻你的微信。现在可以直接问命、问事、查今日运势。",
    agentState: await buildAgentState(env, user, result.binding ?? null),
  });
}

export async function handleHermesWeixinMessage(request: Request, env: CloudflareBindings): Promise<Response> {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const payload = await readSignedPayload(request, env);
  if (payload instanceof Response) return payload;

  const providerUserId = normalizeProviderUserId(payload);
  const text = normalizeText(payload);
  if (!providerUserId) return json({ ok: false, error: "Missing providerUserId" }, 400);
  if (!text) return json({ ok: false, error: "Missing text" }, 400);

  const bindCode = extractBindCode(payload, text);
  if (bindCode) {
    const bindResult = await bindHermesUserByCode(env, {
      bindCode,
      providerUserId,
      nickname: payload.nickname ?? null,
      avatarUrl: payload.avatarUrl ?? null,
      rawPayload: payload.rawPayload ?? payload,
    });
    if (!bindResult.ok) return json({ ok: false, reply: bindResult.reason ?? "绑定失败" }, 400);
    const user = await getUser(env, bindResult.userId ?? "");
    if (!user) return json({ ok: false, reply: "绑定成功但账户读取失败，请稍后重试。" }, 500);
    return json({
      ok: true,
      reply: "绑定成功。戏命师已入驻你的微信。现在可以发送出生年月日时，或直接问今日该怎么走。",
      userId: user.id,
      agentState: await buildAgentState(env, user, bindResult.binding ?? null),
    });
  }

  const { user, binding, created } = await getOrAutoBindHermesUser(env, providerUserId, payload);
  const entitlement = buildEntitlement(user);
  if (!entitlement.enabled) {
    return json({
      ok: true,
      userId: user.id,
      reply: entitlement.reason,
      entitlement,
      agentState: await buildAgentState(env, user, binding),
    });
  }

  const threadId = await getOrCreateThread(env, user.id);
  const now = nowIso();
  const userMessage: ChatMsg = {
    id: randomId("msg"),
    role: "user",
    type: "text",
    text,
    createdAt: now,
  };
  await addMessage(env, threadId, user.id, userMessage);

  const history = await getMessages(env, threadId);
  const birthProfile = await getBirthProfile(env, user.id);
  const chart = birthProfile ? await getOrCreateUserChart(env, user.id, birthProfile) : null;
  const daily = await getOrCreateDailyState(env, user);
  const agent = await getOrCreateActiveMasterAgent(env, user.id);
  const memories = await getMasterAgentMemories(env, agent.id, user.id);

  const generated = await generateMasterReply({
    env,
    user,
    birthProfile,
    chartPromptSummary: chart?.promptSummary ?? null,
    daily,
    history,
    userText: text,
    masterAgent: agent,
    agentMemories: memories,
  });

  const replyMessage: ChatMsg = {
    id: randomId("msg"),
    role: "master",
    type: "text",
    text: generated.text,
    createdAt: nowIso(),
  };
  await addMessage(env, threadId, user.id, replyMessage);

  user.asksToday = Math.min(user.asksMax, user.asksToday + 1);
  await updateUser(env, user);

  return json({
    ok: true,
    created,
    userId: user.id,
    threadId,
    reply: generated.text,
    model: generated.model,
    modelStatus: generated.status,
    entitlement: buildEntitlement(user),
    agentState: await buildAgentState(env, user, binding),
  });
}

export async function handleHermesAgentState(request: Request, env: CloudflareBindings): Promise<Response> {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const payload = await readSignedPayload(request, env);
  if (payload instanceof Response) return payload;
  const resolved = await resolveHermesUser(env, payload);
  if (!resolved) return json({ ok: false, error: "Hermes user is not bound" }, 404);
  return json({ ok: true, agentState: await buildAgentState(env, resolved.user, resolved.binding) });
}

export async function handleHermesEntitlementCheck(
  request: Request,
  env: CloudflareBindings,
): Promise<Response> {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const payload = await readSignedPayload(request, env);
  if (payload instanceof Response) return payload;
  const resolved = await resolveHermesUser(env, payload);
  if (!resolved) return json({ ok: false, enabled: false, error: "Hermes user is not bound" }, 404);
  return json({ ok: true, userId: resolved.user.id, entitlement: buildEntitlement(resolved.user) });
}

export async function handleHermesDailySummary(request: Request, env: CloudflareBindings): Promise<Response> {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const payload = await readSignedPayload(request, env);
  if (payload instanceof Response) return payload;
  const resolved = await resolveHermesUser(env, payload);
  if (!resolved) return json({ ok: false, error: "Hermes user is not bound" }, 404);

  const threadId = await getOrCreateThread(env, resolved.user.id);
  const messages = await getMessages(env, threadId);
  const recentText = messages
    .filter((message) => message.type === "text")
    .slice(-20)
    .map((message) => `${message.role === "user" ? "用户" : "戏命师"}: ${message.text}`)
    .join("\n");

  return json({
    ok: true,
    userId: resolved.user.id,
    memoryPaths: memoryPaths(resolved.user.id),
    summaryInstruction:
      "由腾讯云 Hermes 定时任务读取 recentConversation，整理稳定事实、偏好、目标、命盘补充信息，写入该用户 USER.md / MEMORY.md；不得保存密钥、密码、支付敏感信息。",
    recentConversation: recentText,
  });
}
