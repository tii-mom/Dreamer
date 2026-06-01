import type { BirthProfile } from "../domain";
import type { BirthInfo, ZiweiChart } from "../ziwei/types";
import { generateChart } from "../ziwei/algorithm";
import { buildZiweiPromptContext } from "../ziwei/prompt-context";
import { devStore, nowIso, randomId } from "./xms-store.server";
import { BRANCHES } from "../ziwei/constants";

export const CHART_VERSION = "ziwei-doushu@2026-05-28+xms-v1";

export type StoredBirthChart = {
  id: string;
  userId: string;
  birthProfileJson: string;
  chartJson: string;
  chartSummaryJson: string;
  chartVersion: string;
  createdAt: string;
  updatedAt: string;
};

const BIRTH_TEXT_REGEX =
  /([12][0-9]{3}).{0,8}([01]?[0-9]).{0,4}([0-3]?[0-9])|出生|生日|八字|阳历|阴历|农历/;

export function isBirthText(text: string): boolean {
  return BIRTH_TEXT_REGEX.test(text);
}

export function parseBirthProfileFromText(text: string): BirthProfile | null {
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

export function birthProfileToBirthInfo(profile: BirthProfile): BirthInfo | null {
  const parts = profile.birthDate.split("-");
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  const hourIndex = timeToShichenIndex(profile.birthTime);

  return {
    year,
    month,
    day,
    hour: hourIndex ?? 0,
    gender: profile.gender === "male" ? "male" : "female",
  };
}

export function timeToShichenIndex(time?: string): number | null {
  if (!time) return null;
  const parts = time.split(":");
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h)) return null;

  if (h === 23 || (h === 0 && m <= 59)) return 0; // 子
  if (h === 1 || h === 2) return 1; // 丑
  if (h === 3 || h === 4) return 2; // 寅
  if (h === 5 || h === 6) return 3; // 卯
  if (h === 7 || h === 8) return 4; // 辰
  if (h === 9 || h === 10) return 5; // 巳
  if (h === 11 || h === 12) return 6; // 午
  if (h === 13 || h === 14) return 7; // 未
  if (h === 15 || h === 16) return 8; // 申
  if (h === 17 || h === 18) return 9; // 酉
  if (h === 19 || h === 20) return 10; // 戌
  if (h === 21 || h === 22) return 11; // 亥

  return null;
}

function profileHasBirthTime(profile: BirthProfile): boolean {
  return !!profile.birthTime && timeToShichenIndex(profile.birthTime) !== null;
}

async function getStoredChart(
  env: CloudflareBindings,
  userId: string,
): Promise<StoredBirthChart | null> {
  const db = env.DB;
  if (!db) {
    const stored = devStore().birthCharts.get(userId);
    return stored ? (stored as unknown as StoredBirthChart) : null;
  }
  const row = await db
    .prepare("SELECT * FROM birth_charts WHERE user_id = ?")
    .bind(userId)
    .first<Record<string, string>>();
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    birthProfileJson: row.birth_profile_json,
    chartJson: row.chart_json,
    chartSummaryJson: row.chart_summary_json ?? "",
    chartVersion: row.chart_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getOrCreateUserChart(
  env: CloudflareBindings,
  userId: string,
  profile: BirthProfile | null,
): Promise<{
  chart: ZiweiChart | null;
  promptSummary: string | null;
  stored: StoredBirthChart | null;
}> {
  if (!profile) {
    // Try loading existing chart
    const existing = await getStoredChart(env, userId);
    if (existing) {
      try {
        const chart = JSON.parse(existing.chartJson) as ZiweiChart;
        const summary = existing.chartSummaryJson
          ? (JSON.parse(existing.chartSummaryJson).summary ?? existing.chartSummaryJson)
          : null;
        return { chart, promptSummary: summary, stored: existing };
      } catch {
        return { chart: null, promptSummary: null, stored: null };
      }
    }
    return { chart: null, promptSummary: null, stored: null };
  }

  // Check if profile has birth time
  if (!profileHasBirthTime(profile)) {
    return { chart: null, promptSummary: null, stored: null };
  }

  // Generate or update chart
  return saveOrUpdateUserChart(env, userId, profile);
}

export async function saveOrUpdateUserChart(
  env: CloudflareBindings,
  userId: string,
  profile: BirthProfile,
): Promise<{
  chart: ZiweiChart;
  promptSummary: string;
  stored: StoredBirthChart;
}> {
  const birthInfo = birthProfileToBirthInfo(profile);
  if (!birthInfo) {
    throw new Error("无法从出生资料解析出生信息");
  }

  const chart = generateChart(birthInfo);
  const context = buildZiweiPromptContext(chart);

  const chartJson = JSON.stringify(chart);
  const summaryJson = JSON.stringify({ summary: context.summary, compact: context.compact });
  const now = nowIso();

  const stored: StoredBirthChart = {
    id: randomId("cht"),
    userId,
    birthProfileJson: JSON.stringify(profile),
    chartJson,
    chartSummaryJson: summaryJson,
    chartVersion: CHART_VERSION,
    createdAt: now,
    updatedAt: now,
  };

  const db = env.DB;
  if (!db) {
    devStore().birthCharts.set(userId, stored as unknown as Record<string, unknown>);
  } else {
    await db
      .prepare(
        `INSERT INTO birth_charts (id, user_id, birth_profile_json, chart_json, chart_summary_json, chart_version, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
           birth_profile_json = excluded.birth_profile_json,
           chart_json = excluded.chart_json,
           chart_summary_json = excluded.chart_summary_json,
           chart_version = excluded.chart_version,
           updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(
        stored.id,
        stored.userId,
        stored.birthProfileJson,
        stored.chartJson,
        stored.chartSummaryJson,
        stored.chartVersion,
        stored.createdAt,
        stored.updatedAt,
      )
      .run();
  }

  return { chart, promptSummary: context.summary, stored };
}
