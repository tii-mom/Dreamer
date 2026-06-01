import type { BirthProfile } from "../domain";

export type FortuneSignalSource = "ziwei" | "bazi" | "almanac" | "zodiac" | "western";

export type FortuneTopic =
  | "wealth"
  | "love"
  | "career"
  | "health"
  | "travel"
  | "daily"
  | "personality"
  | "family"
  | "study"
  | "shop";

export type FortuneSignal = {
  id: string;
  source: FortuneSignalSource;
  topic: FortuneTopic;
  title: string;
  evidence: string;
  score: number;
  weight: number;
  advice: string;
  tags?: string[];
};

export type FortuneKernelResult = {
  chartId?: string;
  dateKey: string;
  birthProfile?: BirthProfile | null;
  ziweiSummary?: string | null;
  baziSummary?: string | null;
  almanacSummary?: string | null;
  zodiacSummary?: string | null;
  signals: FortuneSignal[];
};

export type SavedResultKind =
  | "birth_chart"
  | "daily_fortune"
  | "daily_ask"
  | "seal_report"
  | "zodiac_report"
  | "shop_order_report"
  | "share_card"
  | "past_life";

export type SavedFortuneResult = {
  id: string;
  userId: string;
  kind: SavedResultKind;
  title: string;
  summary: string;
  html?: string | null;
  dataJson: string;
  shareToken?: string | null;
  sourceChartId?: string | null;
  model?: string | null;
  tokenEstimate?: number;
  createdAt: string;
  updatedAt: string;
};

export type FortuneBusinessCode =
  | "daily_fortune"
  | "daily_ask"
  | "seal_unlock"
  | "ziwei_report"
  | "bazi_report"
  | "love_match"
  | "zodiac_daily"
  | "shop_order";
