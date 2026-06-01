import { randomBytes } from "node:crypto";
import { devStore, nowIso, randomId } from "./xms-store.server";

export type BotBindTicket = {
  id: string;
  ticket: string;
  bindCode: string;
  userId?: string | null;
  operatorUserId?: string | null;
  referralCode?: string | null;
  masterAssetId?: string | null;
  scene: string;
  provider: string;
  providerUserId?: string | null;
  status: "pending" | "bound" | "expired" | "cancelled";
  expiresAt: string;
  boundAt?: string | null;
  rawJson?: string | null;
  createdAt: string;
  updatedAt: string;
};

const BIND_TICKET_TTL_MS = 10 * 60 * 1000;

function generateBindCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

function generateTicket(): string {
  const entropy = randomBytes(32);
  return entropy.toString("hex");
}

function mapBindRow(row: Record<string, string>): BotBindTicket {
  return {
    id: row.id,
    ticket: row.ticket,
    bindCode: row.bind_code,
    userId: row.user_id ?? null,
    operatorUserId: row.operator_user_id ?? null,
    referralCode: row.referral_code ?? null,
    masterAssetId: row.master_asset_id ?? null,
    scene: row.scene,
    provider: row.provider,
    providerUserId: row.provider_user_id ?? null,
    status: (row.status as BotBindTicket["status"]) || "pending",
    expiresAt: row.expires_at,
    boundAt: row.bound_at ?? null,
    rawJson: row.raw_json ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createBindTicket(
  env: CloudflareBindings,
  input: {
    userId?: string | null;
    operatorUserId?: string | null;
    referralCode?: string | null;
    masterAssetId?: string | null;
    scene?: string;
  },
): Promise<BotBindTicket> {
  const db = env.DB;
  const id = randomId("bnd");
  const ticket = generateTicket();
  const bindCode = generateBindCode();
  const expiresAt = new Date(Date.now() + BIND_TICKET_TTL_MS).toISOString();

  const record: BotBindTicket = {
    id,
    ticket,
    bindCode,
    userId: input.userId ?? null,
    operatorUserId: input.operatorUserId ?? null,
    referralCode: input.referralCode ?? null,
    masterAssetId: input.masterAssetId ?? null,
    scene: input.scene ?? "bind",
    provider: "clawbot",
    providerUserId: null,
    status: "pending",
    expiresAt,
    boundAt: null,
    rawJson: JSON.stringify(input),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  if (db) {
    await db
      .prepare(
        `INSERT INTO bot_bind_tickets
        (id, ticket, bind_code, user_id, operator_user_id, referral_code, master_asset_id, scene, provider, status, expires_at, raw_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        record.id,
        record.ticket,
        record.bindCode,
        record.userId,
        record.operatorUserId,
        record.referralCode,
        record.masterAssetId,
        record.scene,
        record.provider,
        record.status,
        record.expiresAt,
        record.rawJson,
      )
      .run();
  } else {
    devStore().botBindTickets.set(record.id, record as unknown as Record<string, unknown>);
    devStore().botBindTickets.set(
      `code:${record.bindCode}`,
      record as unknown as Record<string, unknown>,
    );
    devStore().botBindTickets.set(
      `ticket:${record.ticket}`,
      record as unknown as Record<string, unknown>,
    );
  }

  return record;
}

export async function getBindTicketByCode(
  env: CloudflareBindings,
  bindCode: string,
): Promise<BotBindTicket | null> {
  const db = env.DB;
  if (!db) {
    const stored = devStore().botBindTickets.get(`code:${bindCode}`);
    return stored ? (stored as unknown as BotBindTicket) : null;
  }

  const row = await db
    .prepare("SELECT * FROM bot_bind_tickets WHERE bind_code = ? LIMIT 1")
    .bind(bindCode)
    .first<Record<string, string>>();

  return row ? mapBindRow(row) : null;
}

export async function getBindTicketByTicket(
  env: CloudflareBindings,
  ticket: string,
): Promise<BotBindTicket | null> {
  const db = env.DB;
  if (!db) {
    const stored = devStore().botBindTickets.get(`ticket:${ticket}`);
    return stored ? (stored as unknown as BotBindTicket) : null;
  }

  const row = await db
    .prepare("SELECT * FROM bot_bind_tickets WHERE ticket = ? LIMIT 1")
    .bind(ticket)
    .first<Record<string, string>>();

  return row ? mapBindRow(row) : null;
}

export async function queryBindTicketStatus(
  env: CloudflareBindings,
  ticket: string,
): Promise<{
  status: "pending" | "bound" | "expired" | "cancelled";
  bound: boolean;
  expired: boolean;
}> {
  const record = await getBindTicketByTicket(env, ticket);
  if (!record) {
    return { status: "expired", bound: false, expired: true };
  }

  const isExpired = new Date(record.expiresAt).getTime() < Date.now();
  if (isExpired && record.status === "pending") {
    await expireBindTicket(env, record.id);
    return { status: "expired", bound: false, expired: true };
  }

  return {
    status: record.status,
    bound: record.status === "bound",
    expired: isExpired,
  };
}

async function markTicketBound(
  env: CloudflareBindings,
  ticket: BotBindTicket,
  providerUserId: string,
): Promise<void> {
  const db = env.DB;
  const boundAt = nowIso();
  if (!db) {
    const stored = devStore().botBindTickets.get(ticket.id) as unknown as BotBindTicket | undefined;
    if (stored) {
      stored.status = "bound";
      stored.providerUserId = providerUserId;
      stored.boundAt = boundAt;
      stored.rawJson = (stored.rawJson || "") + `|bound:${providerUserId}`;
      devStore().botBindTickets.set(stored.id, stored as unknown as Record<string, unknown>);
      devStore().botBindTickets.set(
        `code:${stored.bindCode}`,
        stored as unknown as Record<string, unknown>,
      );
      devStore().botBindTickets.set(
        `ticket:${stored.ticket}`,
        stored as unknown as Record<string, unknown>,
      );
    }
    return;
  }
  await db
    .prepare(
      "UPDATE bot_bind_tickets SET status = 'bound', provider_user_id = ?, bound_at = ?, updated_at = (datetime('now')) WHERE id = ?",
    )
    .bind(providerUserId, boundAt, ticket.id)
    .run();
}

async function expireBindTicket(env: CloudflareBindings, id: string): Promise<void> {
  const db = env.DB;
  if (!db) {
    const stored = devStore().botBindTickets.get(id) as unknown as BotBindTicket | undefined;
    if (stored) {
      stored.status = "expired";
      stored.rawJson = (stored.rawJson || "") + `|expired_at:${nowIso()}`;
      devStore().botBindTickets.set(stored.id, stored as unknown as Record<string, unknown>);
      devStore().botBindTickets.set(
        `code:${stored.bindCode}`,
        stored as unknown as Record<string, unknown>,
      );
      devStore().botBindTickets.set(
        `ticket:${stored.ticket}`,
        stored as unknown as Record<string, unknown>,
      );
    }
    return;
  }
  await db
    .prepare(
      "UPDATE bot_bind_tickets SET status = 'expired', updated_at = (datetime('now')) WHERE id = ?",
    )
    .bind(id)
    .run();
}

export async function bindClawbotUserByCode(
  env: CloudflareBindings,
  input: {
    bindCode: string;
    providerUserId: string;
  },
): Promise<{
  ok: boolean;
  reason?: string;
  userId?: string;
  bindingId?: string;
}> {
  const ticket = await getBindTicketByCode(env, input.bindCode);
  if (!ticket) {
    return { ok: false, reason: "绑定码无效" };
  }

  if (new Date(ticket.expiresAt).getTime() < Date.now()) {
    return { ok: false, reason: "绑定码已过期" };
  }

  if (ticket.status !== "pending") {
    return { ok: false, reason: ticket.status === "bound" ? "绑定码已被使用" : "绑定码已失效" };
  }

  // Ticket must have a userId to bind
  if (!ticket.userId) {
    return { ok: false, reason: "绑定票缺少用户信息，请回到网页重新生成绑定码" };
  }

  // Check if this providerUserId is already bound to another user
  const { getBindingByProviderUser } = await import("./xms-wechat.server");
  const existingBinding = await getBindingByProviderUser(env, "clawbot", input.providerUserId);
  if (existingBinding) {
    if (existingBinding.userId !== ticket.userId) {
      return { ok: false, reason: "该微信已绑定其他戏命师账户，请联系客服处理" };
    }
    // Same user already bound — skip re-creating the binding, just mark ticket
    await markTicketBound(env, ticket, input.providerUserId);
    return { ok: true, userId: ticket.userId, bindingId: existingBinding.id };
  }

  const bindingId = `bin_${crypto.randomUUID().slice(0, 8)}`;
  const { createWechatBinding } = await import("./xms-wechat.server");
  await createWechatBinding(env, {
    id: bindingId,
    userId: ticket.userId,
    provider: "clawbot",
    providerUserId: input.providerUserId,
    status: "active",
    bindScene: ticket.scene,
    rawJson: JSON.stringify({ ticketId: ticket.id, bindCode: input.bindCode }),
  });

  // Handle operator referral if present
  if (ticket.referralCode && ticket.userId) {
    const db = env.DB;
    if (!db) {
      devStore().operatorReferrals.set(`ref_${ticket.userId}`, {
        id: randomId("ref"),
        referralCode: ticket.referralCode,
        operatorUserId: ticket.operatorUserId,
        inviteeUserId: ticket.userId,
        status: "converted",
        convertedAt: nowIso(),
        totalPaidCents: 0,
      });
    } else {
      await db
        .prepare(
          `INSERT INTO operator_referrals
          (id, referral_code, operator_user_id, invitee_user_id, status, converted_at, total_paid_cents)
          VALUES (?, ?, ?, ?, 'converted', ?, 0)`,
        )
        .bind(
          randomId("ref"),
          ticket.referralCode,
          ticket.operatorUserId || null,
          ticket.userId,
          nowIso(),
        )
        .run();
    }
  }

  // Mark ticket as bound
  await markTicketBound(env, ticket, input.providerUserId);

  return { ok: true, userId: ticket.userId, bindingId };
}

export async function expireOldBindTickets(env: CloudflareBindings): Promise<void> {
  const db = env.DB;
  if (!db) {
    for (const [key, val] of devStore().botBindTickets) {
      if (key.startsWith("code:") || key.startsWith("ticket:")) continue;
      const t = val as unknown as BotBindTicket;
      if (t.status === "pending" && new Date(t.expiresAt).getTime() < Date.now()) {
        t.status = "expired";
        t.rawJson = (t.rawJson || "") + `|expired_at:${nowIso()}`;
        devStore().botBindTickets.set(t.id, t as unknown as Record<string, unknown>);
        devStore().botBindTickets.set(
          `code:${t.bindCode}`,
          t as unknown as Record<string, unknown>,
        );
        devStore().botBindTickets.set(
          `ticket:${t.ticket}`,
          t as unknown as Record<string, unknown>,
        );
      }
    }
    return;
  }
  await db
    .prepare(
      "UPDATE bot_bind_tickets SET status = 'expired', updated_at = (datetime('now')) WHERE status = 'pending' AND expires_at < (datetime('now'))",
    )
    .run();
}
