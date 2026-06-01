import { createHash, randomBytes } from "node:crypto";
import { nowIso, devStore } from "./xms-store.server";

export type BotTicketInput = {
  userId: string;
  provider: string;
  providerUserId?: string | null;
  scene: string;
};

export type BotTicket = {
  id: string;
  ticket: string;
  userId: string;
  provider: string;
  providerUserId?: string | null;
  scene: string;
  expiresAt: string;
  usedAt?: string | null;
  createdAt: string;
};

/**
 * Generate a secure random ticket
 */
function generateTicket(): string {
  const entropy = randomBytes(24);
  const timestamp = Date.now().toString(36);
  const sig = createHash("sha256").update(entropy).digest("hex").slice(0, 16);
  return `tkt_${timestamp}_${sig}`;
}

/**
 * Create a new bot ticket for H5 access
 * Ticket expires in 10 minutes by default
 */
export async function createBotTicket(
  env: CloudflareBindings,
  input: BotTicketInput,
  ttlMs: number = 10 * 60 * 1000,
): Promise<BotTicket> {
  const db = env.DB;
  const id = `tkt_${randomBytes(8).toString("hex")}`;
  const ticket = generateTicket();
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();

  const record: BotTicket = {
    id,
    ticket,
    userId: input.userId,
    provider: input.provider,
    providerUserId: input.providerUserId ?? null,
    scene: input.scene,
    expiresAt,
    usedAt: null,
    createdAt: nowIso(),
  };

  if (db) {
    await db
      .prepare(
        `INSERT INTO bot_tickets 
        (id, ticket, user_id, provider, provider_user_id, scene, expires_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        record.id,
        record.ticket,
        record.userId,
        record.provider,
        record.providerUserId,
        record.scene,
        record.expiresAt,
      )
      .run();
  } else {
    devStore().botTickets.set(record.ticket, record as unknown as Record<string, unknown>);
  }

  return record;
}

/**
 * Consume a bot ticket.
 * Returns the ticket data if valid, null if invalid/expired/already used.
 */
export async function consumeBotTicket(
  env: CloudflareBindings,
  ticket: string,
): Promise<BotTicket | null> {
  const db = env.DB;

  if (db) {
    const row = await db
      .prepare("SELECT * FROM bot_tickets WHERE ticket = ? LIMIT 1")
      .bind(ticket)
      .first<Record<string, string>>();

    if (!row) return null;

    // Check expiry
    if (new Date(row.expires_at).getTime() < Date.now()) return null;

    // Check if already used
    if (row.used_at) return null;

    // Mark as used (one-time use)
    await db
      .prepare("UPDATE bot_tickets SET used_at = ? WHERE id = ?")
      .bind(nowIso(), row.id)
      .run();

    return {
      id: row.id,
      ticket: row.ticket,
      userId: row.user_id,
      provider: row.provider,
      providerUserId: row.provider_user_id,
      scene: row.scene,
      expiresAt: row.expires_at,
      usedAt: row.used_at,
      createdAt: row.created_at,
    };
  }

  // Memory store fallback
  const stored = devStore().botTickets.get(ticket) as unknown as BotTicket | undefined;
  if (!stored) return null;
  if (new Date(stored.expiresAt).getTime() < Date.now()) return null;
  if (stored.usedAt) return null;
  return stored;
}

/**
 * Validate a ticket without consuming it (for session validation)
 */
export async function validateBotTicket(
  env: CloudflareBindings,
  ticket: string,
): Promise<BotTicket | null> {
  const db = env.DB;

  if (db) {
    const row = await db
      .prepare("SELECT * FROM bot_tickets WHERE ticket = ? LIMIT 1")
      .bind(ticket)
      .first<Record<string, string>>();

    if (!row) return null;
    if (new Date(row.expires_at).getTime() < Date.now()) return null;
    if (row.used_at) return null;

    return {
      id: row.id,
      ticket: row.ticket,
      userId: row.user_id,
      provider: row.provider,
      providerUserId: row.provider_user_id,
      scene: row.scene,
      expiresAt: row.expires_at,
      usedAt: row.used_at,
      createdAt: row.created_at,
    };
  }

  return null;
}
