import {
  BirthProfile,
  ChatMsg,
  DailyFortune,
  DailyState,
  DailyTask,
  EarnApplication,
  ShareAsset,
  UserProfile,
  PaymentRecord,
  PaymentStatus,
  ProductCode,
} from "../domain";

export const SESSION_COOKIE = "xms_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 90;

type SessionRecord = {
  token: string;
  userId: string;
  expiresAt: string;
};

type ThreadRecord = {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type DevStore = {
  users: Map<string, UserProfile>;
  sessions: Map<string, SessionRecord>;
  birthProfiles: Map<string, BirthProfile>;
  threads: Map<string, ThreadRecord>;
  messages: Map<string, ChatMsg[]>;
  dailyStates: Map<string, DailyState>;
  shares: Map<string, ShareAsset[]>;
  earnApplications: Map<string, EarnApplication>;
  payments: Map<string, PaymentRecord>;
  wechatBindings: Map<string, Record<string, unknown>>;
  botMessages: Map<string, Record<string, unknown>>;
  operators: Map<string, Record<string, unknown>>;
  operatorReferrals: Map<string, Record<string, unknown>>;
  userAssets: Map<string, Record<string, unknown>>;
  inscriptionEquips: Map<string, Record<string, unknown>>;
  blindboxDraws: Map<string, Record<string, unknown>>;
  rewardLedger: Map<string, Record<string, unknown>>;
  events: Array<{
    id: string;
    userId: string | null;
    name: string;
    props: Record<string, unknown>;
    createdAt: string;
  }>;
  aiLogs: Array<{
    id: string;
    userId: string;
    threadId?: string;
    model: string;
    status: string;
    error?: string;
    createdAt: string;
  }>;
};

export function devStore(): DevStore {
  const global = globalThis as typeof globalThis & { __xmsDevStore?: DevStore };
  if (!global.__xmsDevStore) {
    global.__xmsDevStore = {
      users: new Map(),
      sessions: new Map(),
      birthProfiles: new Map(),
      threads: new Map(),
      messages: new Map(),
      dailyStates: new Map(),
      shares: new Map(),
      earnApplications: new Map(),
      payments: new Map(),
      wechatBindings: new Map(),
      botMessages: new Map(),
      operators: new Map(),
      operatorReferrals: new Map(),
      userAssets: new Map(),
      inscriptionEquips: new Map(),
      blindboxDraws: new Map(),
      rewardLedger: new Map(),
      events: [],
      aiLogs: [],
    };
  }
  return global.__xmsDevStore;
}

export function getRuntimeEnv(context?: unknown): CloudflareBindings {
  const candidate = context as CloudflareRequestContext | undefined;
  return candidate?.cloudflare?.env ?? {};
}

export function nowIso() {
  return new Date().toISOString();
}

export function todayKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const pick = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

export function randomId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
}

export function randomToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function recoveryCode() {
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  const code = Array.from(bytes, (byte) => (byte % 36).toString(36).toUpperCase()).join("");
  return `XMS-${code.slice(0, 3)}-${code.slice(3)}`;
}

export function makeFortune(dateKey = todayKey()): DailyFortune {
  const variants = [
    {
      title: "流日财星入迁移宫",
      body: "今日适合对外开口、谈价格、催旧账。别窝着，窝着就是把财星关小黑屋。",
      luckyHour: "15:00-17:00",
      direction: "东南",
      avoid: "临时降价",
    },
    {
      title: "火星临命，嘴快破财",
      body: "今天你赢在行动，输在嘴硬。要谈钱就先写清楚，少在群里激情发言。",
      luckyHour: "10:00-12:00",
      direction: "正东",
      avoid: "冲动回怼",
    },
    {
      title: "文昌照命，适合输出",
      body: "今天适合写方案、发朋友圈、做展示。你不露脸，贵人就只能去扶别人。",
      luckyHour: "20:00-22:00",
      direction: "正南",
      avoid: "只看不发",
    },
  ];
  const day = Number(dateKey.slice(-2)) || 1;
  return variants[day % variants.length];
}

export function makeTasks(checkedIn: boolean, asksUsed: number): DailyTask[] {
  return [
    { key: "greet", label: "向戏命师问安", done: checkedIn, reward: 10 },
    { key: "daily", label: "查看今日流日", done: true, reward: 10 },
    { key: "ask", label: "完成一次问事", done: asksUsed > 0, reward: 20 },
    { key: "share", label: "生成分享卡", done: false, reward: 30 },
    { key: "earn", label: "申请出马资格", done: false, reward: 80 },
  ];
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function boolInt(value: unknown) {
  return value ? 1 : 0;
}

function toBool(value: unknown) {
  return value === 1 || value === true;
}

function mapUser(row: Record<string, unknown>): UserProfile {
  return {
    id: String(row.id),
    recoveryCode: String(row.recovery_code),
    nickname: String(row.nickname),
    level: String(row.level),
    qiyun: Number(row.qiyun ?? 0),
    wallet: Number(row.wallet ?? 0),
    streak: Number(row.streak ?? 0),
    asksToday: Number(row.asks_today ?? 0),
    asksMax: Number(row.asks_max ?? 1),
    sealUnlocked: Number(row.seal_unlocked ?? 30),
    chartGlow: Number(row.chart_glow ?? 30),
    subscribed: toBool(row.subscribed),
    shopOpen: toBool(row.shop_open),
    unread: Number(row.unread ?? 0),
    lastCheckinDate: row.last_checkin_date ? String(row.last_checkin_date) : null,
    subscribedUntil: row.subscribed_until ? String(row.subscribed_until) : null,
    subscriptionPlan: row.subscription_plan ? String(row.subscription_plan) : null,
  };
}

function mapMessage(row: Record<string, unknown>): ChatMsg {
  if (row.type === "card") {
    return {
      id: String(row.id),
      role: "master",
      type: "card",
      card: parseJson(String(row.card_json ?? "{}"), { kind: "sub" }),
      createdAt: String(row.created_at),
    } as ChatMsg;
  }
  return {
    id: String(row.id),
    role: row.role === "user" ? "user" : "master",
    type: "text",
    text: String(row.text ?? ""),
    createdAt: String(row.created_at),
  };
}

export async function getUserBySession(env: CloudflareBindings, token?: string | null) {
  if (!token) return null;
  if (env.SESSION_KV) {
    const cached = await env.SESSION_KV.get<{ userId: string; expiresAt: string }>(
      `session:${token}`,
      "json",
    );
    if (cached && new Date(cached.expiresAt).getTime() > Date.now()) {
      const user = await getUser(env, cached.userId);
      if (user) return user;
    }
  }
  if (env.DB) {
    const row = await env.DB.prepare(
      "SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token = ? AND sessions.expires_at > ?",
    )
      .bind(token, nowIso())
      .first<Record<string, unknown>>();
    return row ? mapUser(row) : null;
  }
  const session = devStore().sessions.get(token);
  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) return null;
  return devStore().users.get(session.userId) ?? null;
}

export async function getUser(env: CloudflareBindings, userId: string) {
  if (env.DB) {
    const row = await env.DB.prepare("SELECT * FROM users WHERE id = ?")
      .bind(userId)
      .first<Record<string, unknown>>();
    return row ? mapUser(row) : null;
  }
  return devStore().users.get(userId) ?? null;
}

export async function getUserByRecoveryCode(env: CloudflareBindings, code: string) {
  const normalized = code.trim().toUpperCase();
  if (env.DB) {
    const row = await env.DB.prepare("SELECT * FROM users WHERE recovery_code = ?")
      .bind(normalized)
      .first<Record<string, unknown>>();
    return row ? mapUser(row) : null;
  }
  return (
    Array.from(devStore().users.values()).find((user) => user.recoveryCode === normalized) ?? null
  );
}

export async function createUser(
  env: CloudflareBindings,
  options?: { id?: string; nickname?: string; source?: string },
) {
  const user: UserProfile = {
    id: options?.id ?? randomId("usr"),
    recoveryCode: recoveryCode(),
    nickname: options?.nickname ?? "小天命",
    level: "见习命师",
    qiyun: 1280,
    wallet: 66.6,
    streak: 0,
    asksToday: 0,
    asksMax: 1,
    sealUnlocked: 30,
    chartGlow: 30,
    subscribed: false,
    shopOpen: false,
    unread: 7,
    lastCheckinDate: null,
    subscribedUntil: null,
    subscriptionPlan: null,
  };
  if (env.DB) {
    await env.DB.prepare(
      "INSERT INTO users (id, recovery_code, nickname, level, qiyun, wallet, streak, asks_today, asks_max, seal_unlocked, chart_glow, subscribed, shop_open, unread) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
      .bind(
        user.id,
        user.recoveryCode,
        user.nickname,
        user.level,
        user.qiyun,
        user.wallet,
        user.streak,
        user.asksToday,
        user.asksMax,
        user.sealUnlocked,
        user.chartGlow,
        boolInt(user.subscribed),
        boolInt(user.shopOpen),
        user.unread,
      )
      .run();
  } else {
    devStore().users.set(user.id, user);
  }
  return user;
}

export async function updateUser(env: CloudflareBindings, user: UserProfile) {
  if (env.DB) {
    await env.DB.prepare(
      "UPDATE users SET nickname = ?, level = ?, qiyun = ?, wallet = ?, streak = ?, asks_today = ?, asks_max = ?, seal_unlocked = ?, chart_glow = ?, subscribed = ?, shop_open = ?, unread = ?, last_checkin_date = ?, subscribed_until = ?, subscription_plan = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    )
      .bind(
        user.nickname,
        user.level,
        user.qiyun,
        user.wallet,
        user.streak,
        user.asksToday,
        user.asksMax,
        user.sealUnlocked,
        user.chartGlow,
        boolInt(user.subscribed),
        boolInt(user.shopOpen),
        user.unread,
        user.lastCheckinDate,
        user.subscribedUntil ?? null,
        user.subscriptionPlan ?? null,
        user.id,
      )
      .run();
  } else {
    devStore().users.set(user.id, user);
  }
  return user;
}

export async function createSession(env: CloudflareBindings, userId: string) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
  if (env.DB) {
    await env.DB.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)")
      .bind(token, userId, expiresAt)
      .run();
  } else {
    devStore().sessions.set(token, { token, userId, expiresAt });
  }
  if (env.SESSION_KV) {
    await env.SESSION_KV.put(`session:${token}`, JSON.stringify({ userId, expiresAt }), {
      expirationTtl: SESSION_TTL_SECONDS,
    });
  }
  return { token, expiresAt };
}

export async function getOrCreateThread(env: CloudflareBindings, userId: string) {
  if (env.DB) {
    const row = await env.DB.prepare(
      "SELECT * FROM threads WHERE user_id = ? ORDER BY created_at LIMIT 1",
    )
      .bind(userId)
      .first<Record<string, unknown>>();
    if (row) return String(row.id);
    const id = randomId("thr");
    await env.DB.prepare("INSERT INTO threads (id, user_id, title) VALUES (?, ?, ?)")
      .bind(id, userId, "与戏命师对话")
      .run();
    return id;
  }
  const store = devStore();
  const existing = Array.from(store.threads.values()).find((thread) => thread.userId === userId);
  if (existing) return existing.id;
  const id = randomId("thr");
  store.threads.set(id, {
    id,
    userId,
    title: "与戏命师对话",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
  store.messages.set(id, []);
  return id;
}

export async function getMessages(env: CloudflareBindings, threadId: string) {
  if (env.DB) {
    const rows = await env.DB.prepare(
      "SELECT * FROM messages WHERE thread_id = ? ORDER BY created_at, id",
    )
      .bind(threadId)
      .all<Record<string, unknown>>();
    return (rows.results ?? []).map(mapMessage);
  }
  return devStore().messages.get(threadId) ?? [];
}

export async function addMessage(
  env: CloudflareBindings,
  threadId: string,
  userId: string,
  message: ChatMsg,
) {
  if (env.DB) {
    await env.DB.prepare(
      "INSERT INTO messages (id, thread_id, user_id, role, type, text, card_kind, card_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
      .bind(
        message.id,
        threadId,
        userId,
        message.role,
        message.type,
        message.type === "text" ? message.text : null,
        message.type === "card" ? message.card.kind : null,
        message.type === "card" ? JSON.stringify(message.card) : null,
        message.createdAt ?? nowIso(),
      )
      .run();
    await env.DB.prepare("UPDATE threads SET updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(threadId)
      .run();
  } else {
    const messages = devStore().messages.get(threadId) ?? [];
    messages.push(message);
    devStore().messages.set(threadId, messages);
  }
  return message;
}

export async function getBirthProfile(env: CloudflareBindings, userId: string) {
  if (env.DB) {
    const row = await env.DB.prepare("SELECT * FROM birth_profiles WHERE user_id = ?")
      .bind(userId)
      .first<Record<string, unknown>>();
    if (!row) return null;
    return {
      calendarType: row.calendar_type === "lunar" ? "lunar" : "solar",
      birthDate: String(row.birth_date),
      birthTime: row.birth_time ? String(row.birth_time) : undefined,
      gender: row.gender === "male" || row.gender === "female" ? row.gender : "unknown",
      rawText: row.raw_text ? String(row.raw_text) : undefined,
    } satisfies BirthProfile;
  }
  return devStore().birthProfiles.get(userId) ?? null;
}

export async function saveBirthProfileRecord(
  env: CloudflareBindings,
  userId: string,
  profile: BirthProfile,
) {
  if (env.DB) {
    await env.DB.prepare(
      "INSERT INTO birth_profiles (user_id, calendar_type, birth_date, birth_time, gender, raw_text) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET calendar_type = excluded.calendar_type, birth_date = excluded.birth_date, birth_time = excluded.birth_time, gender = excluded.gender, raw_text = excluded.raw_text, updated_at = CURRENT_TIMESTAMP",
    )
      .bind(
        userId,
        profile.calendarType,
        profile.birthDate,
        profile.birthTime ?? null,
        profile.gender ?? "unknown",
        profile.rawText ?? null,
      )
      .run();
  } else {
    devStore().birthProfiles.set(userId, profile);
  }
  return profile;
}

export async function getOrCreateDailyState(
  env: CloudflareBindings,
  user: UserProfile,
  dateKey = todayKey(),
) {
  if (env.DB) {
    const row = await env.DB.prepare(
      "SELECT * FROM daily_states WHERE user_id = ? AND date_key = ?",
    )
      .bind(user.id, dateKey)
      .first<Record<string, unknown>>();
    if (row) {
      const asksUsed = Number(row.asks_used ?? 0);
      return {
        dateKey,
        checkedIn: toBool(row.checked_in),
        asksUsed,
        asksMax: user.asksMax,
        streak: user.streak,
        chartGlow: Number(row.chart_glow ?? user.chartGlow),
        tasks: parseJson(
          String(row.tasks_json ?? "[]"),
          makeTasks(toBool(row.checked_in), asksUsed),
        ),
        fortune: parseJson(String(row.fortune_json ?? "{}"), makeFortune(dateKey)),
      } satisfies DailyState;
    }
    const daily = makeDailyState(user, false, 0, dateKey);
    await env.DB.prepare(
      "INSERT INTO daily_states (id, user_id, date_key, checked_in, asks_used, tasks_json, fortune_json, chart_glow) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
      .bind(
        randomId("day"),
        user.id,
        dateKey,
        0,
        0,
        JSON.stringify(daily.tasks),
        JSON.stringify(daily.fortune),
        daily.chartGlow,
      )
      .run();
    return daily;
  }
  const key = `${user.id}:${dateKey}`;
  const existing = devStore().dailyStates.get(key);
  if (existing) return existing;
  const daily = makeDailyState(user, false, 0, dateKey);
  devStore().dailyStates.set(key, daily);
  return daily;
}

function makeDailyState(
  user: UserProfile,
  checkedIn: boolean,
  asksUsed: number,
  dateKey = todayKey(),
): DailyState {
  return {
    dateKey,
    checkedIn,
    asksUsed,
    asksMax: user.asksMax,
    streak: user.streak,
    chartGlow: user.chartGlow,
    tasks: makeTasks(checkedIn, asksUsed),
    fortune: makeFortune(dateKey),
  };
}

export async function saveDailyState(env: CloudflareBindings, userId: string, daily: DailyState) {
  if (env.DB) {
    await env.DB.prepare(
      "UPDATE daily_states SET checked_in = ?, asks_used = ?, tasks_json = ?, fortune_json = ?, chart_glow = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND date_key = ?",
    )
      .bind(
        boolInt(daily.checkedIn),
        daily.asksUsed,
        JSON.stringify(daily.tasks),
        JSON.stringify(daily.fortune),
        daily.chartGlow,
        userId,
        daily.dateKey,
      )
      .run();
  } else {
    devStore().dailyStates.set(`${userId}:${daily.dateKey}`, daily);
  }
  return daily;
}

export async function saveShareAsset(
  env: CloudflareBindings,
  userId: string,
  asset: ShareAsset,
  payload: Record<string, unknown>,
) {
  if (env.DB) {
    await env.DB.prepare(
      "INSERT INTO share_assets (id, user_id, kind, url, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
      .bind(asset.id, userId, asset.kind, asset.url, JSON.stringify(payload), asset.createdAt)
      .run();
  } else {
    const assets = devStore().shares.get(userId) ?? [];
    assets.unshift(asset);
    devStore().shares.set(userId, assets);
  }
  return asset;
}

export async function latestShareAsset(env: CloudflareBindings, userId: string) {
  if (env.DB) {
    const row = await env.DB.prepare(
      "SELECT * FROM share_assets WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
    )
      .bind(userId)
      .first<Record<string, unknown>>();
    if (!row) return null;
    return {
      id: String(row.id),
      kind: row.kind === "daily" || row.kind === "earn" ? row.kind : "seal",
      url: String(row.url),
      copy: String(
        parseJson<Record<string, unknown>>(String(row.payload_json ?? "{}"), {}).copy ?? "",
      ),
      createdAt: String(row.created_at),
    } satisfies ShareAsset;
  }
  return devStore().shares.get(userId)?.[0] ?? null;
}

export async function saveEarnApplication(
  env: CloudflareBindings,
  userId: string,
  input: Omit<EarnApplication, "id" | "status" | "createdAt">,
) {
  const application: EarnApplication = {
    id: randomId("earn"),
    ...input,
    status: "queued",
    createdAt: nowIso(),
  };
  if (env.DB) {
    await env.DB.prepare(
      "INSERT INTO earn_applications (id, user_id, offer, audience, price_range, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
      .bind(
        application.id,
        userId,
        application.offer,
        application.audience,
        application.priceRange,
        application.status,
        application.createdAt,
      )
      .run();
  } else {
    devStore().earnApplications.set(userId, application);
  }
  return application;
}

export async function latestEarnApplication(env: CloudflareBindings, userId: string) {
  if (env.DB) {
    const row = await env.DB.prepare(
      "SELECT * FROM earn_applications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
    )
      .bind(userId)
      .first<Record<string, unknown>>();
    if (!row) return null;
    return {
      id: String(row.id),
      offer: String(row.offer),
      audience: String(row.audience),
      priceRange: String(row.price_range),
      status: row.status === "approved" || row.status === "rejected" ? row.status : "queued",
      createdAt: String(row.created_at),
    } satisfies EarnApplication;
  }
  return devStore().earnApplications.get(userId) ?? null;
}

export async function logEvent(
  env: CloudflareBindings,
  userId: string | null,
  name: string,
  props: Record<string, unknown>,
) {
  if (env.DB) {
    await env.DB.prepare("INSERT INTO events (id, user_id, name, props_json) VALUES (?, ?, ?, ?)")
      .bind(randomId("evt"), userId, name, JSON.stringify(props))
      .run();
  } else {
    devStore().events.push({ id: randomId("evt"), userId, name, props, createdAt: nowIso() });
  }
}

export async function logAiCall(
  env: CloudflareBindings,
  input: {
    userId: string;
    threadId?: string;
    model: string;
    status: "ok" | "fallback" | "error";
    error?: string;
  },
) {
  if (env.DB) {
    await env.DB.prepare(
      "INSERT INTO ai_call_logs (id, user_id, thread_id, model, status, error) VALUES (?, ?, ?, ?, ?, ?)",
    )
      .bind(
        randomId("ai"),
        input.userId,
        input.threadId ?? null,
        input.model,
        input.status,
        input.error ?? null,
      )
      .run();
  } else {
    devStore().aiLogs.push({ id: randomId("ai"), ...input, createdAt: nowIso() });
  }
}

// Payment Store Helpers
function mapPayment(row: Record<string, unknown>): PaymentRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    orderId: String(row.order_id),
    aoid: row.aoid ? String(row.aoid) : null,
    productCode: String(row.product_code) as ProductCode,
    itemName: String(row.item_name),
    payType: String(row.pay_type) as "alipay" | "wechat",
    priceCents: Number(row.price_cents ?? 0),
    displayPrice: String(row.display_price),
    payPriceCents: row.pay_price_cents ? Number(row.pay_price_cents) : null,
    status: String(row.status) as PaymentStatus,
    entitlementApplied: toBool(row.entitlement_applied),
    referralCode: row.referral_code ? String(row.referral_code) : null,
    operatorUserId: row.operator_user_id ? String(row.operator_user_id) : null,
    qr: row.qr ? String(row.qr) : null,
    qrImg: row.qr_img ? String(row.qr_img) : null,
    qrPrice: row.qr_price ? String(row.qr_price) : null,
    expiresAt: row.expires_at ? String(row.expires_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function createPaymentRecord(
  env: CloudflareBindings,
  record: Omit<PaymentRecord, "createdAt" | "updatedAt">,
) {
  const now = nowIso();
  const payment: PaymentRecord = {
    ...record,
    createdAt: now,
    updatedAt: now,
  };

  if (env.DB) {
    await env.DB.prepare(
      "INSERT INTO payments (id, user_id, order_id, aoid, product_code, item_name, pay_type, price_cents, display_price, status, entitlement_applied, referral_code, operator_user_id, qr, qr_img, qr_price, expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
      .bind(
        payment.id,
        payment.userId,
        payment.orderId,
        payment.aoid ?? null,
        payment.productCode,
        payment.itemName,
        payment.payType,
        payment.priceCents,
        payment.displayPrice,
        payment.status,
        boolInt(payment.entitlementApplied),
        payment.referralCode ?? null,
        payment.operatorUserId ?? null,
        payment.qr ?? null,
        payment.qrImg ?? null,
        payment.qrPrice ?? null,
        payment.expiresAt ?? null,
        payment.createdAt,
        payment.updatedAt,
      )
      .run();
  } else {
    devStore().payments.set(payment.orderId, payment);
  }
  return payment;
}

export async function attachProviderPayment(
  env: CloudflareBindings,
  orderId: string,
  providerDetails: {
    aoid: string;
    qr?: string | null;
    qrImg?: string | null;
    qrPrice?: string | null;
    expiresInSeconds: number;
    rawJson: string;
  },
) {
  const expiresAt = new Date(Date.now() + providerDetails.expiresInSeconds * 1000).toISOString();
  if (env.DB) {
    await env.DB.prepare(
      "UPDATE payments SET aoid = ?, qr = ?, qr_img = ?, qr_price = ?, expires_at = ?, provider_raw_json = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?",
    )
      .bind(
        providerDetails.aoid,
        providerDetails.qr ?? null,
        providerDetails.qrImg ?? null,
        providerDetails.qrPrice ?? null,
        expiresAt,
        providerDetails.rawJson,
        orderId,
      )
      .run();
  } else {
    const payment = devStore().payments.get(orderId);
    if (payment) {
      payment.aoid = providerDetails.aoid;
      payment.qr = providerDetails.qr;
      payment.qrImg = providerDetails.qrImg;
      payment.qrPrice = providerDetails.qrPrice;
      payment.expiresAt = expiresAt;
      payment.updatedAt = nowIso();
    }
  }
}

export async function getPaymentByOrderId(env: CloudflareBindings, orderId: string) {
  if (env.DB) {
    const row = await env.DB.prepare("SELECT * FROM payments WHERE order_id = ?")
      .bind(orderId)
      .first<Record<string, unknown>>();
    return row ? mapPayment(row) : null;
  }
  return devStore().payments.get(orderId) ?? null;
}

export async function getPaymentByAoid(env: CloudflareBindings, aoid: string) {
  if (env.DB) {
    const row = await env.DB.prepare("SELECT * FROM payments WHERE aoid = ?")
      .bind(aoid)
      .first<Record<string, unknown>>();
    return row ? mapPayment(row) : null;
  }
  const match = Array.from(devStore().payments.values()).find((p) => p.aoid === aoid);
  return match ?? null;
}

export async function updatePaymentStatus(
  env: CloudflareBindings,
  orderId: string,
  status: PaymentStatus,
  extra?: { payPriceCents?: number; callbackRawJson?: string },
) {
  if (env.DB) {
    await env.DB.prepare(
      "UPDATE payments SET status = ?, pay_price_cents = ?, callback_raw_json = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?",
    )
      .bind(status, extra?.payPriceCents ?? null, extra?.callbackRawJson ?? null, orderId)
      .run();
  } else {
    const payment = devStore().payments.get(orderId);
    if (payment) {
      payment.status = status;
      if (extra?.payPriceCents !== undefined) payment.payPriceCents = extra.payPriceCents;
      payment.updatedAt = nowIso();
    }
  }
}

export async function markPaymentEntitlementApplied(
  env: CloudflareBindings,
  orderId: string,
): Promise<boolean> {
  if (env.DB) {
    const res = await env.DB.prepare(
      "UPDATE payments SET entitlement_applied = 1, updated_at = CURRENT_TIMESTAMP WHERE order_id = ? AND entitlement_applied = 0",
    )
      .bind(orderId)
      .run();
    // In D1, changes is the count of rows modified.
    return (res.meta.changes ?? 0) === 1;
  } else {
    const payment = devStore().payments.get(orderId);
    if (payment && !payment.entitlementApplied) {
      payment.entitlementApplied = true;
      payment.updatedAt = nowIso();
      return true;
    }
    return false;
  }
}
