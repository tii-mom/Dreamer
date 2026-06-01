import { devStore, getD1, nowIso } from "./xms-store.server";

export type UserAsset = {
  id: string;
  userId: string;
  assetType: "master" | "inscription" | "skin" | "ticket" | "frame";
  assetCode: string;
  rarity: string;
  quantity: number;
  level: number;
  locked: number;
  metadataJson?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BlindboxDraw = {
  id: string;
  userId: string;
  paymentId?: string | null;
  boxType: string;
  drawCount: number;
  probabilityVersion: string;
  resultJson: string;
  referralCode?: string | null;
  operatorUserId?: string | null;
  createdAt: string;
};

type UserAssetRow = {
  id: string;
  user_id: string;
  asset_type: UserAsset["assetType"];
  asset_code: string;
  rarity: string;
  quantity: number;
  level: number;
  locked: number;
  metadata_json?: string | null;
  created_at: string;
  updated_at: string;
};

type BlindboxDrawRow = {
  id: string;
  user_id: string;
  payment_id?: string | null;
  box_type: string;
  draw_count: number;
  probability_version: string;
  result_json: string;
  referral_code?: string | null;
  operator_user_id?: string | null;
  created_at: string;
};

export type InscriptionEquip = {
  id: string;
  userId?: string;
  user_id?: string;
  assetId?: string;
  asset_id?: string;
  slotIndex?: number;
  slot_index?: number;
  botScope?: string;
  bot_scope?: string;
  createdAt?: string;
  created_at?: string;
};

export async function getUserAssets(env: CloudflareBindings, userId: string): Promise<UserAsset[]> {
  const db = env.DB;
  if (!db) {
    return Array.from(devStore().userAssets.values()).filter((a) => a.userId === userId);
  }

  const { results } = await db
    .prepare("SELECT * FROM user_assets WHERE user_id = ?")
    .bind(userId)
    .all<UserAssetRow>();

  return results.map((row) => ({
    id: row.id,
    userId: row.user_id,
    assetType: row.asset_type,
    assetCode: row.asset_code,
    rarity: row.rarity,
    quantity: row.quantity,
    level: row.level,
    locked: row.locked,
    metadataJson: row.metadata_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getUserBlindboxDraws(
  env: CloudflareBindings,
  userId: string,
): Promise<BlindboxDraw[]> {
  const db = env.DB;
  if (!db) {
    return Array.from(devStore().blindboxDraws.values()).filter((d) => d.userId === userId);
  }

  const { results } = await db
    .prepare("SELECT * FROM blindbox_draws WHERE user_id = ? ORDER BY created_at DESC")
    .bind(userId)
    .all<BlindboxDrawRow>();

  return results.map((row) => ({
    id: row.id,
    userId: row.user_id,
    paymentId: row.payment_id,
    boxType: row.box_type,
    drawCount: row.draw_count,
    probabilityVersion: row.probability_version,
    resultJson: row.result_json,
    referralCode: row.referral_code,
    operatorUserId: row.operator_user_id,
    createdAt: row.created_at,
  }));
}

export async function getEquippedInscriptions(
  env: CloudflareBindings,
  userId: string,
): Promise<InscriptionEquip[]> {
  const db = env.DB;
  if (!db) {
    return Array.from(devStore().inscriptionEquips.values()).filter((e) => e.userId === userId);
  }

  const { results } = await db
    .prepare("SELECT * FROM inscription_equips WHERE user_id = ?")
    .bind(userId)
    .all<InscriptionEquip>();

  return results;
}

export async function equipInscription(
  env: CloudflareBindings,
  userId: string,
  assetId: string,
  slotIndex: number,
): Promise<boolean> {
  const db = env.DB;
  const now = new Date().toISOString();

  // Verify user owns the asset
  const assets = await getUserAssets(env, userId);
  const owns = assets.find((a) => a.id === assetId);
  if (!owns) return false;

  if (!db) {
    const id = `eq_${crypto.randomUUID().slice(0, 8)}`;
    // Clear slot first
    for (const [k, v] of devStore().inscriptionEquips.entries()) {
      if (v.userId === userId && v.slotIndex === slotIndex) {
        devStore().inscriptionEquips.delete(k);
      }
    }
    devStore().inscriptionEquips.set(id, {
      id,
      userId,
      assetId,
      slotIndex,
      botScope: "default",
      createdAt: now,
    });
    return true;
  }

  // Clear slot first
  await db
    .prepare("DELETE FROM inscription_equips WHERE user_id = ? AND slot_index = ?")
    .bind(userId, slotIndex)
    .run();

  // Insert
  await db
    .prepare(
      `INSERT INTO inscription_equips 
      (id, user_id, asset_id, slot_index) 
      VALUES (?, ?, ?, ?)`,
    )
    .bind(`eq_${crypto.randomUUID().slice(0, 8)}`, userId, assetId, slotIndex)
    .run();

  return true;
}
