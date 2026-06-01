import { createHash } from "node:crypto";
import type { UserProfile, PaymentRecord } from "../domain";
import { getUser, updateUser, devStore, getD1, nowIso } from "./xms-store.server";

type PaymentRow = PaymentRecord & {
  entitlement_applied?: number;
  product_code?: string;
  user_id?: string;
  display_price?: string;
};

function normalizePaymentRow(row: PaymentRow | null | undefined): PaymentRecord | null {
  if (!row) return null;
  return {
    ...row,
    entitlementApplied: row.entitlementApplied ?? row.entitlement_applied === 1,
    productCode: row.productCode ?? row.product_code,
    userId: row.userId ?? row.user_id,
    displayPrice: row.displayPrice ?? row.display_price,
  } as PaymentRecord;
}

// Define first-version products registry
export const PRODUCTS_REGISTRY: Record<string, { code: string; name: string; priceCents: number }> =
  {
    seal_unlock: {
      code: "seal_unlock",
      name: "解封命盘",
      priceCents: 599,
    },
    operator_899: {
      code: "operator_899",
      name: "命铺经营者",
      priceCents: 89900,
    },
    blindbox_single: {
      code: "blindbox_single",
      name: "命师盲盒单抽",
      priceCents: 9900,
    },
    blindbox_ten: {
      code: "blindbox_ten",
      name: "命师盲盒十连抽",
      priceCents: 88800,
    },
  };

// Standard MD5 function utilizing Node.js native crypto via compatibility layer
export function md5(input: string): string {
  return createHash("md5").update(input, "utf8").digest("hex").toLowerCase();
}

export async function applyPaymentEntitlement(env: CloudflareBindings, payment: PaymentRecord) {
  const db = env.DB;
  const now = new Date().toISOString();

  // Ensure entitlement is applied only once
  if (payment.entitlementApplied) {
    console.log(`[Payment] Entitlement already applied for order ${payment.orderId}, skipping.`);
    return;
  }

  const user = await getUser(env, payment.userId);
  if (!user) {
    console.error(`[Payment] User not found for payment entitlement: ${payment.userId}`);
    return;
  }

  console.log(
    `[Payment] Applying entitlement for order ${payment.orderId}, product: ${payment.productCode}`,
  );

  switch (payment.productCode) {
    case "seal_unlock":
      user.sealUnlocked = 100;
      user.chartGlow = 100;
      await updateUser(env, user);
      break;

    case "operator_899": {
      // Activate operator status in operators table
      const referralCode = `ref_${crypto.randomUUID().slice(0, 8)}`;
      const subUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      if (!db) {
        devStore().operators.set(user.id, {
          id: `op_${crypto.randomUUID().slice(0, 8)}`,
          userId: user.id,
          plan: "operator_899",
          status: "active",
          referralCode,
          subscribedUntil: subUntil,
          totalInvites: 0,
          totalConversions: 0,
          totalPaidCents: 0,
          incenseValue: 0,
          riskStatus: "normal",
        });
      } else {
        await db
          .prepare(
            `INSERT INTO operators 
            (id, user_id, plan, status, referral_code, subscribed_until) 
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET 
            status = 'active', subscribed_until = ?, updated_at = CURRENT_TIMESTAMP`,
          )
          .bind(
            `op_${crypto.randomUUID().slice(0, 8)}`,
            user.id,
            "operator_899",
            "active",
            referralCode,
            subUntil,
            subUntil,
          )
          .run();
      }

      // Update user details
      user.shopOpen = true;
      user.subscribed = true;
      user.asksMax = Math.max(user.asksMax, 10);
      await updateUser(env, user);
      break;
    }

    case "blindbox_single":
    case "blindbox_ten": {
      // Perform draw in memory or D1 and grant assets
      const drawsCount = payment.productCode === "blindbox_ten" ? 10 : 1;
      const results: Array<{ assetCode: string; rarity: string; assetType: string }> = [];

      for (let i = 0; i < drawsCount; i++) {
        const roll = Math.random() * 100;
        let rarity = "normal";
        let assetCode = "";
        const assetType = "inscription";

        if (roll < 5) {
          rarity = "legendary";
          assetCode = "tianji_rune";
        } else if (roll < 20) {
          rarity = "epic";
          assetCode = "wuxu_rune";
        } else if (roll < 50) {
          rarity = "rare";
          assetCode = "caibo_rune";
        } else {
          rarity = "normal";
          assetCode = "taohua_rune";
        }

        results.push({ assetCode, rarity, assetType });

        if (!db) {
          const assetId = `ast_${crypto.randomUUID().slice(0, 8)}`;
          devStore().userAssets.set(assetId, {
            id: assetId,
            userId: user.id,
            assetType,
            assetCode,
            rarity,
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
            .bind(`ast_${crypto.randomUUID().slice(0, 8)}`, user.id, assetType, assetCode, rarity)
            .run();
        }
      }

      // Record blindbox draws
      if (!db) {
        devStore().blindboxDraws.set(payment.orderId, {
          id: `drw_${crypto.randomUUID().slice(0, 8)}`,
          userId: user.id,
          paymentId: payment.id,
          boxType: payment.productCode,
          drawCount: drawsCount,
          probabilityVersion: "v1.0",
          resultJson: JSON.stringify(results),
          referralCode: payment.referralCode || null,
          operatorUserId: payment.operatorUserId || null,
        });
      } else {
        await db
          .prepare(
            `INSERT INTO blindbox_draws
            (id, user_id, payment_id, box_type, draw_count, probability_version, result_json, referral_code, operator_user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            `drw_${crypto.randomUUID().slice(0, 8)}`,
            user.id,
            payment.id,
            payment.productCode,
            drawsCount,
            "v1.0",
            JSON.stringify(results),
            payment.referralCode || null,
            payment.operatorUserId || null,
          )
          .run();
      }
      break;
    }
  }

  // Handle Operator Conversion Attribution
  // Skip if operator is buying for themselves to prevent self-referral abuse
  if (payment.referralCode && payment.operatorUserId && payment.operatorUserId !== payment.userId) {
    const payPriceCents = payment.payPriceCents || payment.priceCents;

    // Divide price by 100 to get dollar value, 1 Yuan = 1 incense value
    const newIncenseValue = Math.floor(payPriceCents / 100);

    if (!db) {
      // Memory Store logic
      // Find operator referral record for this invitee and update
      for (const refObj of devStore().operatorReferrals.values()) {
        if (
          refObj.referralCode === payment.referralCode &&
          refObj.inviteeUserId === payment.userId
        ) {
          refObj.convertedAt = now;
          refObj.firstPaymentId = payment.id;
          refObj.totalPaidCents = (Number(refObj.totalPaidCents) || 0) + payPriceCents;
          refObj.status = "converted";
        }
      }

      // Update operator dashboard counters
      const opObj = devStore().operators.get(payment.operatorUserId);
      if (opObj) {
        opObj.totalConversions = (Number(opObj.totalConversions) || 0) + 1;
        opObj.totalPaidCents = (Number(opObj.totalPaidCents) || 0) + payPriceCents;
        opObj.incenseValue = (Number(opObj.incenseValue) || 0) + newIncenseValue;
        opObj.updatedAt = now;
      }
    } else {
      // D1 SQL logic
      // 1. Update the referral status to converted
      await db
        .prepare(
          `UPDATE operator_referrals
          SET converted_at = ?, first_payment_id = ?, total_paid_cents = total_paid_cents + ?, status = 'converted'
          WHERE referral_code = ? AND invitee_user_id = ?`,
        )
        .bind(now, payment.id, payPriceCents, payment.referralCode, payment.userId)
        .run();

      // 2. Update operator statistics
      await db
        .prepare(
          `UPDATE operators
          SET total_conversions = total_conversions + 1,
              total_paid_cents = total_paid_cents + ?,
              incense_value = incense_value + ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?`,
        )
        .bind(payPriceCents, newIncenseValue, payment.operatorUserId)
        .run();
    }
  }

  // Set entitlement applied flag
  if (!db) {
    const localPayment = devStore().payments.get(payment.orderId);
    if (localPayment) {
      localPayment.entitlementApplied = true;
    }
  } else {
    await db
      .prepare(
        "UPDATE payments SET entitlement_applied = 1, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?",
      )
      .bind(payment.orderId)
      .run();
  }
}

export async function handleBufPayCallback(
  request: Request,
  env: CloudflareBindings,
): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let bodyText = "";
  let params: URLSearchParams;
  try {
    bodyText = await request.text();
    params = new URLSearchParams(bodyText);
  } catch (err) {
    return new Response("Invalid Body", { status: 400 });
  }

  const aoid = params.get("aoid");
  const orderId = params.get("order_id");
  const orderUid = params.get("order_uid");
  const price = params.get("price");
  const payPrice = params.get("pay_price");
  const sign = params.get("sign");

  if (!aoid || !orderId || !orderUid || !price || !payPrice || !sign) {
    console.error("[Payment Callback] Missing parameters in callback:", bodyText);
    return new Response("ok", { status: 200 });
  }

  const secretKey = env.BUFPAY_SECRET || env.SESSION_SECRET || "MOCK_SECRET";
  const calculatedSign = md5(`${aoid}${orderId}${orderUid}${price}${payPrice}${secretKey}`);

  if (sign.toLowerCase() !== calculatedSign) {
    console.error(
      "[Payment Callback] Signature mismatch. Calculated:",
      calculatedSign,
      "Received:",
      sign,
    );
    return new Response("Signature Verification Failed", { status: 400 });
  }

  // Retrieve payment
  const db = env.DB;
  let payment: PaymentRecord | null = null;
  if (!db) {
    payment = devStore().payments.get(orderId) ?? null;
  } else {
    const row = await db
      .prepare("SELECT * FROM payments WHERE order_id = ? LIMIT 1")
      .bind(orderId)
      .first<PaymentRow>();
    payment = normalizePaymentRow(row);
  }

  if (!payment) {
    console.error("[Payment Callback] Payment record not found:", orderId);
    return new Response("ok", { status: 200 });
  }

  if (payment.userId !== orderUid) {
    console.error(
      "[Payment Callback] User mismatch. Expected:",
      payment.userId,
      "Received:",
      orderUid,
    );
    return new Response("ok", { status: 200 });
  }

  if (payment.displayPrice !== price) {
    console.error(
      "[Payment Callback] Price mismatch. Expected:",
      payment.displayPrice,
      "Received:",
      price,
    );
    return new Response("ok", { status: 200 });
  }

  // Update status to success
  const payPriceCents = Math.round(parseFloat(payPrice) * 100);
  if (!db) {
    const p = devStore().payments.get(orderId);
    if (p) {
      p.status = "success";
      p.payPriceCents = payPriceCents;
    }
  } else {
    await db
      .prepare(
        "UPDATE payments SET status = 'success', pay_price_cents = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?",
      )
      .bind(payPriceCents, orderId)
      .run();
  }

  // Apply entitlement
  await applyPaymentEntitlement(env, payment);

  return new Response("ok", { status: 200 });
}

export async function handleMockPaymentSuccess(
  request: Request,
  env: CloudflareBindings,
): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const isMockEnabled = env.BUFPAY_MOCK === "true" || !env.BUFPAY_SECRET;
  if (!isMockEnabled) {
    return new Response("Forbidden in production", { status: 403 });
  }

  let body: { orderId: string };
  try {
    body = await request.json();
  } catch (err) {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { orderId } = body;
  if (!orderId) {
    return new Response("Missing orderId", { status: 400 });
  }

  const db = env.DB;
  let payment: PaymentRecord | null = null;
  if (!db) {
    payment = devStore().payments.get(orderId) ?? null;
  } else {
    const row = await db
      .prepare("SELECT * FROM payments WHERE order_id = ? LIMIT 1")
      .bind(orderId)
      .first<PaymentRow>();
    payment = normalizePaymentRow(row);
  }

  if (!payment) {
    return new Response("Order not found", { status: 404 });
  }

  if (payment.status !== "success" && payment.status !== "mock_success") {
    if (!db) {
      const p = devStore().payments.get(orderId);
      if (p) {
        p.status = "mock_success";
        p.payPriceCents = p.priceCents;
      }
    } else {
      await db
        .prepare(
          "UPDATE payments SET status = 'mock_success', pay_price_cents = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?",
        )
        .bind(payment.priceCents, orderId)
        .run();
    }

    await applyPaymentEntitlement(env, payment);
  }

  return new Response(JSON.stringify({ status: "ok" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleAdminRequest(
  request: Request,
  env: CloudflareBindings,
): Promise<Response> {
  const url = new URL(request.url);
  const authHeader = request.headers.get("Authorization") || url.searchParams.get("token") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  const adminToken = env.ADMIN_TOKEN || "admin_secret";

  if (!token || token !== adminToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const path = url.pathname.replace("/api/admin/", "");
  const db = env.DB;

  if (path === "order") {
    const orderId = url.searchParams.get("orderId");
    if (!orderId) return new Response("Missing orderId", { status: 400 });
    let payment = null;
    if (!db) {
      payment = devStore().payments.get(orderId) || null;
    } else {
      payment = await db
        .prepare("SELECT * FROM payments WHERE order_id = ?")
        .bind(orderId)
        .first<PaymentRow>();
    }
    if (!payment) return new Response("Order not found", { status: 404 });
    return new Response(JSON.stringify(payment), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Not Found", { status: 404 });
}
