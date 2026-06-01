import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  addMessage,
  createSession,
  createUser,
  getBirthProfile,
  getMessages,
  getOrCreateDailyState,
  getOrCreateThread,
  getRuntimeEnv,
  getUserByRecoveryCode,
  getUserBySession,
  latestEarnApplication,
  latestShareAsset,
  logAiCall,
  logEvent,
  nowIso,
  randomId,
  saveBirthProfileRecord,
  saveDailyState,
  saveEarnApplication,
  saveShareAsset,
  todayKey,
  updateUser,
  createPaymentRecord,
  attachProviderPayment,
  getPaymentByOrderId,
  getPaymentByAoid,
} from "./xms-store.server";
import { generateMasterReply } from "./xms-ai.server";
import type {
  AppBootstrap,
  BirthProfile,
  CardPayload,
  ChatMsg,
  DailyState,
  ShareAsset,
  UserProfile,
  PaymentRecord,
  ProductCode,
} from "../domain";

export type SessionCookieWriter = (token: string) => void;

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: true,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

function onboardingMessages(user: UserProfile): ChatMsg[] {
  return [
    {
      id: randomId("msg"),
      role: "master",
      type: "text",
      text: "哟，终于有人把我从二维码里扫出来了。",
      createdAt: nowIso(),
    },
    {
      id: randomId("msg"),
      role: "master",
      type: "text",
      text: `我是你的专属戏命师。先记好你的恢复码：${user.recoveryCode}。换手机别哭，拿它回来找我。`,
      createdAt: nowIso(),
    },
    {
      id: randomId("msg"),
      role: "master",
      type: "text",
      text: "先别急着问姻缘财运。八字报来：年月日时，阳历阴历都行，缺一项我就只能漏三成天机。",
      createdAt: nowIso(),
    },
    {
      id: randomId("msg"),
      role: "master",
      type: "card",
      card: { kind: "seal", unlocked: user.sealUnlocked },
      createdAt: nowIso(),
    },
  ];
}

function isBirthText(text: string) {
  return /([12][0-9]{3}).{0,8}([01]?[0-9]).{0,4}([0-3]?[0-9])|出生|生日|八字|阳历|阴历|农历/.test(
    text,
  );
}

function profileFromText(text: string): BirthProfile | null {
  const match = text.match(
    /([12][0-9]{3})\D+([01]?[0-9])\D+([0-3]?[0-9])(?:\D+([0-2]?[0-9])\D*(?:点|时)?)?/,
  );
  if (!match) return null;
  const [, year, month, day, hour] = match;
  const date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  return {
    calendarType: /阴历|农历/.test(text) ? "lunar" : "solar",
    birthDate: date,
    birthTime: hour ? `${hour.padStart(2, "0")}:00` : undefined,
    gender: "unknown",
    rawText: text,
  };
}

function cardForTopic(
  text: string,
  daily: DailyState,
  earnStatus: "queued" | "approved" | "none",
): CardPayload | null {
  if (/出马|赚钱|副业|接单|订单/.test(text)) return { kind: "earn", status: earnStatus };
  if (/盲盒|抽|灵签/.test(text)) return { kind: "box" };
  if (/市场|挂售|卖|交易/.test(text)) return { kind: "market" };
  if (/今日|流日|吉时|运势/.test(text)) {
    return {
      kind: "daily",
      title: daily.fortune.title,
      body: daily.fortune.body,
      luckyHour: daily.fortune.luckyHour,
      direction: daily.fortune.direction,
    };
  }
  if (/解封|命盘|八字|生日|出生/.test(text)) return { kind: "seal", unlocked: 30 };
  if (daily.asksUsed >= daily.asksMax) return { kind: "sub" };
  return null;
}

async function seedOnboardingIfNeeded(
  env: CloudflareBindings,
  user: UserProfile,
  threadId: string,
) {
  const existing = await getMessages(env, threadId);
  if (existing.length) return existing;
  const seed = onboardingMessages(user);
  for (const message of seed) {
    await addMessage(env, threadId, user.id, message);
  }
  return seed;
}

export async function ensureSessionFromToken(
  context: unknown,
  token: string | undefined,
  writeCookie?: SessionCookieWriter,
) {
  const env = getRuntimeEnv(context);
  let user = await getUserBySession(env, token);
  if (!user) {
    user = await createUser(env);
    const session = await createSession(env, user.id);
    writeCookie?.(session.token);
    await logEvent(env, user.id, "session_created", { source: "web" });
  } else {
    if (
      user.subscribed &&
      user.subscribedUntil &&
      new Date(user.subscribedUntil).getTime() <= Date.now()
    ) {
      user.subscribed = false;
      user.asksMax = 1;
      user = await updateUser(env, user);
      await logEvent(env, user.id, "subscription_expired", { expiredAt: user.subscribedUntil });
    }
  }
  const threadId = await getOrCreateThread(env, user.id);
  const messages = await seedOnboardingIfNeeded(env, user, threadId);
  const daily = await getOrCreateDailyState(env, user);
  const birthProfile = await getBirthProfile(env, user.id);
  const earnApplication = await latestEarnApplication(env, user.id);
  const shareAsset = await latestShareAsset(env, user.id);
  return {
    user,
    threadId,
    messages,
    daily,
    birthProfile,
    earnApplication,
    shareAsset,
  } satisfies AppBootstrap;
}

export async function restoreSessionByCode(
  context: unknown,
  code: string,
  writeCookie?: SessionCookieWriter,
) {
  const env = getRuntimeEnv(context);
  const user = await getUserByRecoveryCode(env, code);
  if (!user) throw new Error("恢复码不对。戏命师翻遍命簿也没找到你。");
  const session = await createSession(env, user.id);
  writeCookie?.(session.token);
  await logEvent(env, user.id, "session_restored", {});
  const threadId = await getOrCreateThread(env, user.id);
  const messages = await seedOnboardingIfNeeded(env, user, threadId);
  const daily = await getOrCreateDailyState(env, user);
  return {
    user,
    threadId,
    messages,
    daily,
    birthProfile: await getBirthProfile(env, user.id),
    earnApplication: await latestEarnApplication(env, user.id),
    shareAsset: await latestShareAsset(env, user.id),
  } satisfies AppBootstrap;
}

export async function handleUserMessage(
  context: unknown,
  token: string | undefined,
  input: { threadId: string; text: string },
) {
  const env = getRuntimeEnv(context);
  const bootstrap = await ensureSessionFromToken(context, token);
  const text = input.text.trim();
  const now = nowIso();
  const userMessage: ChatMsg = {
    id: randomId("msg"),
    role: "user",
    type: "text",
    text,
    createdAt: now,
  };
  await addMessage(env, input.threadId, bootstrap.user.id, userMessage);

  let user = bootstrap.user;
  let birthProfile = bootstrap.birthProfile;
  if (!birthProfile && isBirthText(text)) {
    birthProfile = profileFromText(text) ?? {
      calendarType: /阴历|农历/.test(text) ? "lunar" : "solar",
      birthDate: todayKey(),
      gender: "unknown",
      rawText: text,
    };
    await saveBirthProfileRecord(env, user.id, birthProfile);
    user = await updateUser(env, {
      ...user,
      sealUnlocked: Math.max(user.sealUnlocked, 30),
      chartGlow: Math.max(user.chartGlow, 38),
    });
  }

  let daily = await getOrCreateDailyState(env, user);
  const consumesAsk = !/恢复码|分享|生成分享|出马申请/.test(text);
  if (consumesAsk) {
    daily = { ...daily, asksUsed: Math.min(daily.asksUsed + 1, daily.asksMax + 1) };
    daily.tasks = daily.tasks.map((task) => (task.key === "ask" ? { ...task, done: true } : task));
    await saveDailyState(env, user.id, daily);
    user = await updateUser(env, { ...user, asksToday: daily.asksUsed });
  }

  const history = await getMessages(env, input.threadId);
  const reply = await generateMasterReply({
    env,
    user,
    birthProfile,
    daily,
    history,
    userText: text,
  });
  await logAiCall(env, {
    userId: user.id,
    threadId: input.threadId,
    model: reply.model,
    status: reply.status,
    error: reply.error,
  });

  const assistantMessage: ChatMsg = {
    id: randomId("msg"),
    role: "master",
    type: "text",
    text: reply.text,
    createdAt: nowIso(),
  };
  await addMessage(env, input.threadId, user.id, assistantMessage);

  const earnStatus = (await latestEarnApplication(env, user.id))?.status ?? "none";
  const card = cardForTopic(text, daily, earnStatus);
  const cardMessage: ChatMsg | null = card
    ? { id: randomId("msg"), role: "master", type: "card", card, createdAt: nowIso() }
    : null;
  if (cardMessage) await addMessage(env, input.threadId, user.id, cardMessage);
  await logEvent(env, user.id, "message_sent", {
    topic: card?.kind ?? "chat",
    aiStatus: reply.status,
  });

  return {
    user,
    daily,
    birthProfile,
    userMessage,
    assistantMessage,
    cardMessage,
  };
}

export async function saveBirthProfile(
  context: unknown,
  token: string | undefined,
  profile: BirthProfile,
) {
  const env = getRuntimeEnv(context);
  const bootstrap = await ensureSessionFromToken(context, token);
  const saved = await saveBirthProfileRecord(env, bootstrap.user.id, profile);
  const user = await updateUser(env, {
    ...bootstrap.user,
    sealUnlocked: 30,
    chartGlow: Math.max(bootstrap.user.chartGlow, 40),
  });
  await logEvent(env, user.id, "birth_profile_saved", { calendarType: profile.calendarType });
  return { user, birthProfile: saved };
}

export async function checkInDaily(context: unknown, token: string | undefined) {
  const env = getRuntimeEnv(context);
  const bootstrap = await ensureSessionFromToken(context, token);
  const alreadyChecked = bootstrap.daily.checkedIn;
  const nextStreak = alreadyChecked ? bootstrap.user.streak : bootstrap.user.streak + 1;
  const user = await updateUser(env, {
    ...bootstrap.user,
    streak: nextStreak,
    qiyun: alreadyChecked ? bootstrap.user.qiyun : bootstrap.user.qiyun + 10,
    chartGlow: alreadyChecked
      ? bootstrap.user.chartGlow
      : Math.min(100, bootstrap.user.chartGlow + 4),
    lastCheckinDate: bootstrap.daily.dateKey,
  });
  const daily: DailyState = {
    ...bootstrap.daily,
    checkedIn: true,
    streak: user.streak,
    chartGlow: user.chartGlow,
    tasks: bootstrap.daily.tasks.map((task) =>
      task.key === "greet" ? { ...task, done: true } : task,
    ),
  };
  await saveDailyState(env, user.id, daily);
  await logEvent(env, user.id, alreadyChecked ? "daily_checkin_repeat" : "daily_checkin", {
    streak: user.streak,
  });
  return { user, daily, alreadyChecked };
}

function svgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function buildShareSvg(user: UserProfile, daily: DailyState, kind: "seal" | "daily" | "earn") {
  const title =
    kind === "earn"
      ? "我的戏命铺子候补中"
      : kind === "daily"
        ? daily.fortune.title
        : `命盘已开 ${user.sealUnlocked}%`;
  const body =
    kind === "earn"
      ? "我让戏命师替我接单，你也来排队。"
      : kind === "daily"
        ? daily.fortune.body
        : "剩下天机，需道友助力。";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#21102f"/><stop offset="1" stop-color="#08070d"/></linearGradient>
    <linearGradient id="gold" x1="0" x2="1"><stop stop-color="#ffe8a3"/><stop offset="1" stop-color="#b77a22"/></linearGradient>
  </defs>
  <rect width="900" height="1200" fill="url(#bg)"/>
  <circle cx="450" cy="360" r="230" fill="none" stroke="#d7a94d" stroke-width="6" stroke-dasharray="12 18" opacity=".8"/>
  <text x="450" y="160" text-anchor="middle" font-size="44" fill="url(#gold)" font-family="serif">戏 命 师</text>
  <text x="450" y="430" text-anchor="middle" font-size="74" fill="#ffe8a3" font-family="serif">戲</text>
  <text x="450" y="650" text-anchor="middle" font-size="42" fill="#ffe8a3" font-family="serif">${escapeXml(title)}</text>
  <foreignObject x="120" y="710" width="660" height="180">
    <div xmlns="http://www.w3.org/1999/xhtml" style="color:#f7eed6;font-size:30px;line-height:1.45;text-align:center;font-family:system-ui">${escapeXml(body)}</div>
  </foreignObject>
  <rect x="360" y="940" width="180" height="180" rx="20" fill="#f7eed6"/>
  <text x="450" y="1038" text-anchor="middle" font-size="28" fill="#141018" font-family="monospace">XMS</text>
  <text x="450" y="1140" text-anchor="middle" font-size="24" fill="#a98a4b">扫码领取你的专属戏命师 · ${escapeXml(user.nickname)}</text>
</svg>`;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function generateShareCard(
  context: unknown,
  token: string | undefined,
  kind: "seal" | "daily" | "earn",
) {
  const env = getRuntimeEnv(context);
  const bootstrap = await ensureSessionFromToken(context, token);
  const id = randomId("share");
  const svg = buildShareSvg(bootstrap.user, bootstrap.daily, kind);
  let url = svgDataUrl(svg);
  const copy =
    kind === "earn"
      ? "我在排队开通戏命出马，让 AI 命师替我生成报告和接单菜单。想一起搞钱，扫码。"
      : kind === "daily"
        ? `今日我的流日是「${bootstrap.daily.fortune.title}」，吉时 ${bootstrap.daily.fortune.luckyHour}。你的呢？`
        : `我的命盘已开 ${bootstrap.user.sealUnlocked}%，剩下天机需要道友助力。`;

  if (env.ASSETS_BUCKET) {
    const key = `share/${bootstrap.user.id}/${id}.svg`;
    await env.ASSETS_BUCKET.put(key, svg, {
      httpMetadata: { contentType: "image/svg+xml; charset=utf-8" },
    });
    const baseUrl = env.APP_BASE_URL || "";
    url = `${baseUrl}/api/assets/${key}`;
  }

  const asset: ShareAsset = { id, kind, url, copy, createdAt: nowIso() };
  await saveShareAsset(env, bootstrap.user.id, asset, {
    copy,
    chartGlow: bootstrap.user.chartGlow,
  });
  await logEvent(env, bootstrap.user.id, "share_card_generated", { kind });
  return asset;
}

export async function applyEarnAccess(
  context: unknown,
  token: string | undefined,
  input: { offer: string; audience: string; priceRange: string },
) {
  const env = getRuntimeEnv(context);
  const bootstrap = await ensureSessionFromToken(context, token);
  const application = await saveEarnApplication(env, bootstrap.user.id, input);
  const user = await updateUser(env, {
    ...bootstrap.user,
    qiyun: bootstrap.user.qiyun + 80,
    chartGlow: Math.min(100, bootstrap.user.chartGlow + 8),
    shopOpen: true,
  });
  const daily = {
    ...bootstrap.daily,
    chartGlow: Math.min(100, bootstrap.daily.chartGlow + 8),
    tasks: bootstrap.daily.tasks.map((task) =>
      task.key === "earn" ? { ...task, done: true } : task,
    ),
  };
  await saveDailyState(env, user.id, daily);
  await logEvent(env, user.id, "earn_access_applied", { priceRange: input.priceRange });
  return { user, daily, application };
}

export async function recordEvent(
  context: unknown,
  token: string | undefined,
  name: string,
  props: Record<string, unknown>,
) {
  const env = getRuntimeEnv(context);
  const user = await getUserBySession(env, token);
  await logEvent(env, user?.id ?? null, name, props);
  return { ok: true };
}

import { md5 } from "./xms-payment.server";
import { getProduct, formatPrice } from "../products";

export async function createPaymentOrderService(
  context: unknown,
  token: string | undefined,
  input: {
    productCode: ProductCode;
    payType: "alipay" | "wechat";
    amountCents?: number;
  },
) {
  const env = getRuntimeEnv(context);
  const bootstrap = await ensureSessionFromToken(context, token);
  const user = bootstrap.user;

  const product = getProduct(input.productCode);

  let priceCents = product.priceCents;
  if (input.productCode === "qiyun_topup") {
    if (!input.amountCents || input.amountCents < 100 || input.amountCents > 1000000) {
      throw new Error("无效的充值金额");
    }
    priceCents = input.amountCents;
  }

  const displayPrice = formatPrice(priceCents);
  const orderId = randomId("pay");

  // Read referral code from cookie
  let referralCode: string | null = null;
  let operatorUserId: string | null = null;
  try {
    const { getCookie: getCookieServer } = await import("@tanstack/react-start/server");
    referralCode = getCookieServer("referral_code") || null;
    if (referralCode) {
      // Find operator by referral code to store the operator_user_id
      const { getOperatorByReferralCode } = await import("./xms-operator.server");
      const operator = await getOperatorByReferralCode(env, referralCode);
      if (operator) {
        operatorUserId = operator.userId;
      }
    }
  } catch (err) {
    console.error("Failed to read referral cookie in createPaymentOrderService:", err);
  }

  // Create local record as pending
  const localRecord = await createPaymentRecord(env, {
    id: randomId("payrec"),
    userId: user.id,
    orderId,
    productCode: input.productCode,
    itemName: product.name,
    payType: input.payType,
    priceCents,
    displayPrice,
    status: "pending",
    entitlementApplied: false,
    referralCode,
    operatorUserId,
  });

  const aid = env.BUFPAY_AID;
  const secretKey = env.BUFPAY_SECRET || env.SESSION_SECRET || "MOCK_SECRET";
  const isMock = env.BUFPAY_MOCK === "true" || !aid;

  if (isMock) {
    // Return mock payment info
    const mockAoid = `mock_${randomId("aoid")}`;
    const mockQr = "https://bufpay.com/mock-payment-qr";
    const mockQrImg =
      "data:image/svg+xml;charset=utf-8," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#1b1227" stroke="#d7a94d" stroke-width="4"/><text x="100" y="90" fill="#ffe8a3" text-anchor="middle" font-size="14" font-weight="bold">测试模式 · 模拟二维码</text><text x="100" y="115" fill="#a98a4b" text-anchor="middle" font-size="11">扫码将模拟完成支付</text><text x="100" y="145" fill="#f7eed6" text-anchor="middle" font-size="14" font-weight="bold">¥${displayPrice}</text></svg>`,
      );

    await attachProviderPayment(env, orderId, {
      aoid: mockAoid,
      qr: mockQr,
      qrImg: mockQrImg,
      qrPrice: displayPrice,
      expiresInSeconds: 300,
      rawJson: JSON.stringify({ mock: true }),
    });

    const updated = await getPaymentByOrderId(env, orderId);
    return {
      status: "ok",
      orderId,
      aoid: mockAoid,
      payType: input.payType,
      price: displayPrice,
      qrPrice: displayPrice,
      qr: mockQr,
      qrImg: mockQrImg,
      expiresIn: 300,
      isMock: true,
    };
  }

  // Real production integration with BufPay
  const notifyUrl = `${env.APP_BASE_URL || ""}/api/pay/callback`;
  const returnUrl = `${env.APP_BASE_URL || ""}/?pay_return=${orderId}`;
  const feedbackUrl = `${env.APP_BASE_URL || ""}/?pay_feedback=${orderId}`;

  // Signature calculation: name + pay_type + price + order_id + order_uid + notify_url + return_url + feedback_url + secret
  const signString = `${product.name}${input.payType}${displayPrice}${orderId}${user.id}${notifyUrl}${returnUrl}${feedbackUrl}${secretKey}`;
  const sign = md5(signString);

  const bodyParams = new URLSearchParams({
    name: product.name,
    pay_type: input.payType,
    price: displayPrice,
    order_id: orderId,
    order_uid: user.id,
    notify_url: notifyUrl,
    return_url: returnUrl,
    feedback_url: feedbackUrl,
    sign,
  });

  try {
    const response = await fetch(
      `https://bufpay.com/api/pay/${aid}?format=json&expire=300&user_cache=true`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: bodyParams,
      },
    );

    const data = (await response.json()) as Record<string, unknown>;
    if (data && data.status === "ok") {
      await attachProviderPayment(env, orderId, {
        aoid: String(data.aoid),
        qr: String(data.qr),
        qrImg: String(data.qr_img),
        qrPrice: String(data.qr_price),
        expiresInSeconds: Number(data.expires_in || 300),
        rawJson: JSON.stringify(data),
      });

      return {
        status: "ok",
        orderId,
        aoid: String(data.aoid),
        payType: String(data.pay_type),
        price: String(data.price),
        qrPrice: String(data.qr_price),
        qr: String(data.qr),
        qrImg: String(data.qr_img),
        expiresIn: Number(data.expires_in || 300),
        isMock: false,
      };
    } else {
      console.error("[BufPay] Failed to create order:", data);
      throw new Error(data?.status || "BufPay Request Failed");
    }
  } catch (error) {
    console.error("[BufPay] Error creating order:", error);
    throw error;
  }
}

export async function queryPaymentStatusService(
  context: unknown,
  token: string | undefined,
  input: { orderId: string },
) {
  const env = getRuntimeEnv(context);
  const payment = await getPaymentByOrderId(env, input.orderId);
  if (!payment) {
    throw new Error("订单不存在");
  }

  // If local status is already success, return it immediately
  if (payment.status === "success" || payment.status === "mock_success") {
    return { status: payment.status, priceCents: payment.priceCents };
  }

  const aid = env.BUFPAY_AID;
  const isMock = env.BUFPAY_MOCK === "true" || !aid;

  // If not mock and we have an aoid, query BufPay API directly to sync in case callback was delayed
  if (
    !isMock &&
    payment.aoid &&
    (payment.status === "pending" || payment.status === "new" || payment.status === "payed")
  ) {
    try {
      const response = await fetch(`https://bufpay.com/api/query/${payment.aoid}`);
      const data = (await response.json()) as Record<string, unknown>;

      // BufPay statuses: new, payed, success, fee_error, expire
      if (data && data.status) {
        if (data.status === "success" || data.status === "payed") {
          // Sync locally and trigger entitlement
          const localStatus = data.status === "success" ? "success" : "payed";
          await updatePaymentStatus(env, payment.orderId, localStatus, {
            payPriceCents: payment.priceCents,
            callbackRawJson: JSON.stringify(data),
          });

          if (data.status === "success") {
            const updated = await getPaymentByOrderId(env, payment.orderId);
            if (updated) {
              await applyPaymentEntitlement(env, updated);
            }
            return { status: "success", priceCents: payment.priceCents };
          }
        } else if (data.status === "expire") {
          await updatePaymentStatus(env, payment.orderId, "expire");
        }
      }
    } catch (err) {
      console.error("[BufPay Query] Failed to query status from provider:", err);
    }
  }

  // Refetch to return latest local status
  const current = await getPaymentByOrderId(env, input.orderId);
  return { status: current?.status || payment.status, priceCents: payment.priceCents };
}
