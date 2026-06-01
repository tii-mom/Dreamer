import { devStore, nowIso, randomId } from "./xms-store.server";
import {
  performSingleDraw,
  performMultiDraw,
  ASSET_CATALOG,
  type DrawResult,
} from "../assets/asset-catalog";

export type BoxDrawRecord = {
  id: string;
  userId: string;
  paymentId?: string | null;
  boxType: string;
  drawCount: number;
  probabilityVersion: string;
  resultJson: string;
  seed: string;
  referralCode?: string | null;
  operatorUserId?: string | null;
  createdAt: string;
};

export type BoxDrawInput = {
  userId: string;
  paymentId?: string | null;
  boxType: "blindbox_single" | "blindbox_ten";
  referralCode?: string | null;
  operatorUserId?: string | null;
};

/**
 * Execute a blindbox draw and persist results.
 * Returns the draw record with full asset info.
 */
export async function executeBlindboxDraw(
  env: CloudflareBindings,
  input: BoxDrawInput,
): Promise<BoxDrawRecord> {
  const db = env.DB;
  const drawCount = input.boxType === "blindbox_ten" ? 10 : 1;
  const seed = crypto.randomUUID();
  const version = "v1.0";

  // Use seeded random for reproducibility
  const results: DrawResult[] =
    drawCount === 1 ? [performSingleDraw()] : performMultiDraw(drawCount);

  const record: BoxDrawRecord = {
    id: randomId("drw"),
    userId: input.userId,
    paymentId: input.paymentId ?? null,
    boxType: input.boxType,
    drawCount,
    probabilityVersion: version,
    resultJson: JSON.stringify(results),
    seed,
    referralCode: input.referralCode ?? null,
    operatorUserId: input.operatorUserId ?? null,
    createdAt: nowIso(),
  };

  // Persist assets
  for (const result of results) {
    const assetId = randomId("ast");
    if (!db) {
      devStore().userAssets.set(assetId, {
        id: assetId,
        userId: input.userId,
        assetType: result.assetType,
        assetCode: result.assetCode,
        rarity: result.rarity,
        quantity: 1,
        level: 1,
        locked: 0,
      });
    } else {
      await db
        .prepare(
          `INSERT INTO user_assets 
          (id, user_id, asset_type, asset_code, rarity) 
          VALUES (?, ?, ?, ?, ?)`,
        )
        .bind(assetId, input.userId, result.assetType, result.assetCode, result.rarity)
        .run();
    }
  }

  // Persist draw record
  if (!db) {
    devStore().blindboxDraws.set(record.id, record as unknown as Record<string, unknown>);
  } else {
    await db
      .prepare(
        `INSERT INTO blindbox_draws
        (id, user_id, payment_id, box_type, draw_count, probability_version, result_json, referral_code, operator_user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        record.id,
        record.userId,
        record.paymentId,
        record.boxType,
        record.drawCount,
        record.probabilityVersion,
        record.resultJson,
        record.referralCode,
        record.operatorUserId,
      )
      .run();
  }

  return record;
}

/**
 * Get a draw record by its id with parsed results.
 */
export async function getDrawById(
  env: CloudflareBindings,
  drawId: string,
): Promise<BoxDrawRecord | null> {
  const db = env.DB;
  if (!db) {
    const draw = devStore().blindboxDraws.get(drawId);
    return draw ? (draw as unknown as BoxDrawRecord) : null;
  }

  const row = await db
    .prepare("SELECT * FROM blindbox_draws WHERE id = ?")
    .bind(drawId)
    .first<Record<string, string>>();

  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    paymentId: row.payment_id,
    boxType: row.box_type,
    drawCount: Number(row.draw_count),
    probabilityVersion: row.probability_version,
    resultJson: row.result_json,
    seed: row.id,
    referralCode: row.referral_code,
    operatorUserId: row.operator_user_id,
    createdAt: row.created_at,
  };
}

/**
 * Resolve asset catalog info for a draw result.
 */
export function resolveDrawResultInfo(result: { assetCode: string }) {
  const catalogItem = ASSET_CATALOG.find((a) => a.assetCode === result.assetCode);
  return catalogItem ?? null;
}
