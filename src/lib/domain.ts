export type ModalKey = "topup" | "sub" | "box" | "market" | "earn" | "share" | "seal" | "greet";

export type UserProfile = {
  id: string;
  nickname: string;
  recoveryCode: string;
  level: string;
  qiyun: number;
  wallet: number;
  streak: number;
  asksToday: number;
  asksMax: number;
  sealUnlocked: number;
  chartGlow: number;
  subscribed: boolean;
  shopOpen: boolean;
  unread: number;
  lastCheckinDate: string | null;
  subscribedUntil?: string | null;
  subscriptionPlan?: string | null;
};

export type BirthProfile = {
  calendarType: "solar" | "lunar";
  birthDate: string;
  birthTime?: string;
  gender?: "male" | "female" | "unknown";
  rawText?: string;
};

export type CardPayload =
  | { kind: "reading"; title: string; topic: string; body: string }
  | { kind: "seal"; unlocked: number }
  | { kind: "daily"; title: string; body: string; luckyHour: string; direction: string }
  | { kind: "sub" }
  | { kind: "shop" }
  | { kind: "box" }
  | { kind: "market" }
  | { kind: "earn"; status: "queued" | "approved" | "none" }
  | { kind: "share"; url: string; copy: string };

export type ChatMsg =
  | { id: string; role: "master" | "user"; type: "text"; text: string; createdAt?: string }
  | { id: string; role: "master"; type: "card"; card: CardPayload; createdAt?: string };

export type DailyTask = {
  key: string;
  label: string;
  done: boolean;
  reward: number;
};

export type DailyFortune = {
  title: string;
  body: string;
  luckyHour: string;
  direction: string;
  avoid: string;
};

export type DailyState = {
  dateKey: string;
  checkedIn: boolean;
  asksUsed: number;
  asksMax: number;
  streak: number;
  chartGlow: number;
  tasks: DailyTask[];
  fortune: DailyFortune;
};

export type EarnApplication = {
  id: string;
  offer: string;
  audience: string;
  priceRange: string;
  status: "queued" | "approved" | "rejected";
  createdAt: string;
};

export type ShareAsset = {
  id: string;
  kind: "seal" | "daily" | "earn";
  url: string;
  copy: string;
  createdAt: string;
};

export type AppBootstrap = {
  user: UserProfile;
  threadId: string;
  messages: ChatMsg[];
  daily: DailyState;
  birthProfile: BirthProfile | null;
  earnApplication: EarnApplication | null;
  shareAsset: ShareAsset | null;
};

export type PaymentStatus =
  | "pending"
  | "new"
  | "payed"
  | "success"
  | "fee_error"
  | "expire"
  | "failed"
  | "mock_success";

export type ProductCode =
  | "seal_unlock"
  | "operator_899"
  | "blindbox_single"
  | "blindbox_ten"
  | "qiyun_topup";

export type PaymentRecord = {
  id: string;
  userId: string;
  orderId: string;
  aoid?: string | null;
  productCode: ProductCode;
  itemName: string;
  payType: "alipay" | "wechat";
  priceCents: number;
  displayPrice: string;
  payPriceCents?: number | null;
  status: PaymentStatus;
  entitlementApplied: boolean;
  referralCode?: string | null;
  operatorUserId?: string | null;
  qr?: string | null;
  qrImg?: string | null;
  qrPrice?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
};
