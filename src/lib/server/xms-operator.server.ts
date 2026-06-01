import { devStore, getD1, nowIso } from "./xms-store.server";

export type Operator = {
  id: string;
  userId: string;
  plan: string;
  status: string;
  shopName?: string | null;
  referralCode: string;
  subscribedUntil?: string | null;
  totalInvites: number;
  totalConversions: number;
  totalPaidCents: number;
  incenseValue: number;
  riskStatus: string;
  createdAt: string;
  updatedAt: string;
};

export type OperatorReferral = {
  id: string;
  operatorUserId: string;
  inviteeUserId?: string | null;
  referralCode: string;
  sourceScene?: string | null;
  firstTouchAt: string;
  convertedAt?: string | null;
  firstPaymentId?: string | null;
  totalPaidCents: number;
  status: string;
  ipHash?: string | null;
  uaHash?: string | null;
};

type OperatorRow = {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  shop_name?: string | null;
  referral_code: string;
  subscribed_until?: string | null;
  total_invites: number;
  total_conversions: number;
  total_paid_cents: number;
  incense_value: number;
  risk_status: string;
  created_at: string;
  updated_at: string;
};

type OperatorStatsRow = {
  total_invites: number;
  total_conversions: number;
  incense_value: number;
};

export async function getOperatorByUserId(
  env: CloudflareBindings,
  userId: string,
): Promise<Operator | null> {
  const db = env.DB;
  if (!db) {
    return devStore().operators.get(userId) || null;
  }

  const row = await db
    .prepare("SELECT * FROM operators WHERE user_id = ? LIMIT 1")
    .bind(userId)
    .first<OperatorRow>();
  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    plan: row.plan,
    status: row.status,
    shopName: row.shop_name,
    referralCode: row.referral_code,
    subscribedUntil: row.subscribed_until,
    totalInvites: row.total_invites,
    totalConversions: row.total_conversions,
    totalPaidCents: row.total_paid_cents,
    incenseValue: row.incense_value,
    riskStatus: row.risk_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getOperatorByReferralCode(
  env: CloudflareBindings,
  referralCode: string,
): Promise<Operator | null> {
  const db = env.DB;
  if (!db) {
    for (const op of devStore().operators.values()) {
      if (op.referralCode === referralCode) return op;
    }
    return null;
  }

  const row = await db
    .prepare("SELECT * FROM operators WHERE referral_code = ? LIMIT 1")
    .bind(referralCode)
    .first<OperatorRow>();
  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    plan: row.plan,
    status: row.status,
    shopName: row.shop_name,
    referralCode: row.referral_code,
    subscribedUntil: row.subscribed_until,
    totalInvites: row.total_invites,
    totalConversions: row.total_conversions,
    totalPaidCents: row.total_paid_cents,
    incenseValue: row.incense_value,
    riskStatus: row.risk_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function recordReferralVisit(
  env: CloudflareBindings,
  referralCode: string,
  inviteeUserId: string | null,
  ip: string | null,
  ua: string | null,
): Promise<void> {
  const db = env.DB;
  const operator = await getOperatorByReferralCode(env, referralCode);
  if (!operator) return;

  const now = new Date().toISOString();
  const id = `ref_${crypto.randomUUID().slice(0, 8)}`;

  if (!db) {
    devStore().operatorReferrals.set(id, {
      id,
      operatorUserId: operator.userId,
      inviteeUserId,
      referralCode,
      sourceScene: "web",
      firstTouchAt: now,
      totalPaidCents: 0,
      status: "visited",
      ipHash: ip,
      uaHash: ua,
    });

    // Increment operator total invites
    operator.totalInvites += 1;
    return;
  }

  // Check if this visitor has already visited to prevent duplicate count
  const exist = await db
    .prepare(
      "SELECT id FROM operator_referrals WHERE referral_code = ? AND invitee_user_id = ? LIMIT 1",
    )
    .bind(referralCode, inviteeUserId || "")
    .first();

  if (exist) return;

  await db
    .prepare(
      `INSERT INTO operator_referrals 
      (id, operator_user_id, invitee_user_id, referral_code, source_scene, first_touch_at, status, ip_hash, ua_hash) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      operator.userId,
      inviteeUserId || null,
      referralCode,
      "web",
      now,
      "visited",
      ip || null,
      ua || null,
    )
    .run();

  await db
    .prepare(
      "UPDATE operators SET total_invites = total_invites + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
    )
    .bind(operator.userId)
    .run();
}

export async function getReferralsCount(env: CloudflareBindings, operatorUserId: string) {
  const db = env.DB;
  if (!db) {
    const op = devStore().operators.get(operatorUserId);
    return {
      invites: op?.totalInvites ?? 0,
      conversions: op?.totalConversions ?? 0,
      incense: op?.incenseValue ?? 0,
    };
  }

  const row = await db
    .prepare(
      "SELECT total_invites, total_conversions, incense_value FROM operators WHERE user_id = ? LIMIT 1",
    )
    .bind(operatorUserId)
    .first<OperatorStatsRow>();

  if (!row) return { invites: 0, conversions: 0, incense: 0 };
  return {
    invites: row.total_invites,
    conversions: row.total_conversions,
    incense: row.incense_value,
  };
}
