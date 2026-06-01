import { createHash } from "node:crypto";
import {
  PAST_LIFE_PRESETS,
  RARITY_LABELS,
  RARITY_PERCENT,
  getPresetsByCamp,
  type PastLifeCamp,
  type PastLifeRarity,
  type PastLifePreset,
} from "../share/past-life-presets";
import type { ZiweiChart } from "../ziwei/types";
import { devStore, nowIso, randomId } from "./xms-store.server";

export type PastLifeResult = {
  id: string;
  userId: string;
  chartId: string | null;
  preset: PastLifePreset;
  title: string;
  rarity: PastLifeRarity;
  camp: PastLifeCamp;
  chartReasonShort: string;
  shareToken: string;
  createdAt: string;
};

function buildChartFingerprint(chart: ZiweiChart): string {
  const sihuaList = chart.palaces.flatMap((p) =>
    p.stars.filter((s) => s.siHua).map((s) => `${s.name}化${s.siHua}`),
  );
  return [
    chart.birthInfo.year,
    chart.birthInfo.month,
    chart.birthInfo.day,
    chart.birthInfo.gender,
    chart.mingGongBranch,
    chart.palaces
      .find((p) => p.name === "命宫")
      ?.stars.filter((s) => s.type === "major")
      .map((s) => s.name)
      .join(","),
    chart.palaces
      .find((p) => p.name === "财帛宫")
      ?.stars.filter((s) => s.type === "major")
      .map((s) => s.name)
      .join(","),
    chart.palaces
      .find((p) => p.name === "官禄宫")
      ?.stars.filter((s) => s.type === "major")
      .map((s) => s.name)
      .join(","),
    chart.palaces
      .find((p) => p.name === "夫妻宫")
      ?.stars.filter((s) => s.type === "major")
      .map((s) => s.name)
      .join(","),
    chart.palaces
      .find((p) => p.name === "福德宫")
      ?.stars.filter((s) => s.type === "major")
      .map((s) => s.name)
      .join(","),
    chart.palaces
      .find((p) => p.name === "迁移宫")
      ?.stars.filter((s) => s.type === "major")
      .map((s) => s.name)
      .join(","),
    sihuaList.join(","),
    (chart.patterns || []).map((p) => p.name).join(","),
  ].join("|");
}

const SI_HUA_WEIGHTS: Record<string, number> = {
  禄: 8,
  权: 8,
  科: 6,
  忌: 8,
};

const CAMP_STARS: Record<PastLifeCamp, string[]> = {
  power: ["紫微", "天府", "天相", "天梁"],
  wealth: ["武曲", "天府", "太阴", "禄存"],
  love: ["贪狼", "廉贞", "红鸾", "天喜"],
  jianghu: ["七杀", "破军", "火星", "铃星"],
  immortal: ["天机", "天梁", "文昌", "文曲"],
  underworld: ["巨门"],
};

const PALACE_WEIGHTS: Record<string, number> = {
  命宫: 40,
  官禄宫: 18,
  财帛宫: 18,
  夫妻宫: 10,
  福德宫: 8,
  迁移宫: 8,
};

const CAMP_PATTERNS: Record<PastLifeCamp, string[]> = {
  power: ["君臣庆会", "紫府同宫", "府相朝垣"],
  wealth: ["火贪", "铃贪", "武贪"],
  love: [],
  jianghu: ["杀破狼"],
  immortal: ["机月同梁"],
  underworld: [],
};

function hashFingerprint(input: string): number {
  const h = createHash("sha256").update(input).digest("hex");
  return parseInt(h.slice(0, 12), 16);
}

export function resolvePastLifeFromChart(chart: ZiweiChart): {
  preset: PastLifePreset;
  chartReasonShort: string;
} {
  const scores: Record<PastLifeCamp, number> = {
    power: 0,
    wealth: 0,
    love: 0,
    jianghu: 0,
    immortal: 0,
    underworld: 0,
  };

  const reasonParts: string[] = [];

  // Score each palace
  for (const palace of chart.palaces) {
    const pw = PALACE_WEIGHTS[palace.name] || 0;
    if (!pw) continue;

    for (const star of palace.stars) {
      for (const camp of Object.keys(CAMP_STARS) as PastLifeCamp[]) {
        if (CAMP_STARS[camp].includes(star.name)) {
          scores[camp] += pw;
        }
      }
    }

    // Sihua
    for (const star of palace.stars) {
      if (star.siHua) {
        const w = SI_HUA_WEIGHTS[star.siHua] || 0;
        if (star.siHua === "禄") {
          scores.wealth += w;
          scores.immortal += w * 0.5;
        }
        if (star.siHua === "权") {
          scores.power += w;
        }
        if (star.siHua === "科") {
          scores.immortal += w;
        }
        if (star.siHua === "忌") {
          scores.underworld += w;
          scores.jianghu += w * 0.5;
        }
      }
    }

    // Sha stars favor jianghu/underworld
    for (const star of palace.stars) {
      if (star.type === "sha") {
        scores.jianghu += 6;
        scores.underworld += 6;
      }
    }
  }

  // Pattern bonuses
  if (chart.patterns) {
    for (const pattern of chart.patterns) {
      for (const camp of Object.keys(CAMP_PATTERNS) as PastLifeCamp[]) {
        for (const pn of CAMP_PATTERNS[camp]) {
          if (pattern.name.includes(pn)) {
            scores[camp] += 10;
          }
        }
      }
    }
  }

  // Find highest score camp
  let bestCamp: PastLifeCamp = "power";
  let bestScore = 0;
  for (const camp of Object.keys(scores) as PastLifeCamp[]) {
    if (scores[camp] > bestScore) {
      bestScore = scores[camp];
      bestCamp = camp;
    }
  }

  // Build reason
  const mingPalace = chart.palaces.find((p) => p.branch === chart.mingGongBranch);
  if (mingPalace) {
    const majors = mingPalace.stars.filter((s) => s.type === "major").map((s) => s.name);
    if (majors.length) reasonParts.push(`命宫见${majors.join("、")}`);
  }

  const sihuaList = chart.palaces.flatMap((p) =>
    p.stars.filter((s) => s.siHua).map((s) => `${s.name}化${s.siHua}`),
  );
  if (sihuaList.length) reasonParts.push(`四化带${sihuaList.slice(0, 3).join("、")}`);

  if (chart.patterns?.length) {
    reasonParts.push(`格局见${chart.patterns[0].name}`);
  }

  const reasonShort = reasonParts.join("，") || "命盘结构综合";

  // Determine rarity
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  let rarity: PastLifeRarity = "normal";
  if (bestScore > 250) {
    rarity = "legendary";
  } else if (bestScore > 170) {
    rarity = "epic";
  } else if (bestScore > 100) {
    rarity = "rare";
  }

  // Deterministic pick from camp pool
  const pool = getPresetsByCamp(bestCamp).filter((p) => p.rarity === rarity);
  const fallbackPool = pool.length > 0 ? pool : getPresetsByCamp(bestCamp);

  const fingerprintStr = [
    chart.birthInfo.year,
    chart.birthInfo.month,
    chart.birthInfo.day,
    chart.birthInfo.gender,
    chart.mingGongBranch,
    chart.palaces
      .find((p) => p.name === "命宫")
      ?.stars.filter((s) => s.type === "major")
      .map((s) => s.name)
      .join(","),
    chart.palaces
      .find((p) => p.name === "财帛宫")
      ?.stars.filter((s) => s.type === "major")
      .map((s) => s.name)
      .join(","),
    chart.palaces
      .find((p) => p.name === "官禄宫")
      ?.stars.filter((s) => s.type === "major")
      .map((s) => s.name)
      .join(","),
    sihuaList.join(","),
    (chart.patterns || []).map((p) => p.name).join(","),
  ].join("|");

  const idx = hashFingerprint(fingerprintStr) % fallbackPool.length;
  const preset = fallbackPool[idx];

  return {
    preset,
    chartReasonShort: reasonShort,
  };
}

export async function getOrCreatePastLifeResult(
  env: CloudflareBindings,
  userId: string,
  chart: ZiweiChart,
  chartId?: string,
): Promise<PastLifeResult> {
  const db = env.DB;
  const fingerprint = buildChartFingerprint(chart);

  // Check existing by user_id AND matching fingerprint
  if (db) {
    const existing = await db
      .prepare(
        "SELECT * FROM past_life_results WHERE user_id = ? AND chart_fingerprint = ? LIMIT 1",
      )
      .bind(userId, fingerprint)
      .first<Record<string, string>>();
    if (existing) {
      return {
        id: existing.id,
        userId: existing.user_id,
        chartId: existing.chart_id,
        preset: PAST_LIFE_PRESETS.find((p) => p.id === existing.preset_id)!,
        title: existing.title,
        rarity: existing.rarity as PastLifeRarity,
        camp: PAST_LIFE_PRESETS.find((p) => p.id === existing.preset_id)!.camp,
        chartReasonShort: JSON.parse(existing.result_json).chartReasonShort || "",
        shareToken: existing.share_token,
        createdAt: existing.created_at,
      };
    }
  } else {
    const store = devStore();
    const existing = store.pastLifeResults.get(userId) as PastLifeResult | undefined;
    if (existing) return existing;
  }

  const { preset, chartReasonShort } = resolvePastLifeFromChart(chart);
  const id = randomId("plr");
  const shareToken = randomId("pls");

  const result: PastLifeResult = {
    id,
    userId,
    chartId: chartId ?? null,
    preset,
    title: preset.title,
    rarity: preset.rarity,
    camp: preset.camp,
    chartReasonShort,
    shareToken,
    createdAt: nowIso(),
  };

  const resultJson = JSON.stringify({
    presetId: preset.id,
    camp: preset.camp,
    rarity: preset.rarity,
    chartReasonShort,
  });

  if (db) {
    try {
      await db
        .prepare(
          `INSERT INTO past_life_results
          (id, user_id, chart_id, chart_fingerprint, preset_id, title, rarity, result_json, share_token)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          result.id,
          result.userId,
          result.chartId,
          fingerprint,
          result.preset.id,
          result.title,
          result.rarity,
          resultJson,
          result.shareToken,
        )
        .run();
    } catch {
      // UNIQUE conflict on (user_id, chart_fingerprint) — re-read the winner
      const existing = await db
        .prepare(
          "SELECT * FROM past_life_results WHERE user_id = ? AND chart_fingerprint = ? LIMIT 1",
        )
        .bind(userId, fingerprint)
        .first<Record<string, string>>();
      if (existing) {
        return {
          id: existing.id,
          userId: existing.user_id,
          chartId: existing.chart_id,
          preset: PAST_LIFE_PRESETS.find((p) => p.id === existing.preset_id)!,
          title: existing.title,
          rarity: existing.rarity as PastLifeRarity,
          camp: PAST_LIFE_PRESETS.find((p) => p.id === existing.preset_id)!.camp,
          chartReasonShort: JSON.parse(existing.result_json).chartReasonShort || "",
          shareToken: existing.share_token,
          createdAt: existing.created_at,
        };
      }
      throw new Error("Failed to insert or read past life result after conflict");
    }
  } else {
    const store = devStore();
    store.pastLifeResults.set(userId, result as unknown as Record<string, unknown>);
    store.pastLifeResults.set(
      `share:${result.shareToken}`,
      result as unknown as Record<string, unknown>,
    );
  }

  return result;
}

export async function getPastLifeResultByShareToken(
  env: CloudflareBindings,
  shareToken: string,
): Promise<PastLifeResult | null> {
  const db = env.DB;
  if (!db) {
    const store = devStore();
    return (store.pastLifeResults.get(`share:${shareToken}`) as PastLifeResult) ?? null;
  }

  const row = await db
    .prepare("SELECT * FROM past_life_results WHERE share_token = ? LIMIT 1")
    .bind(shareToken)
    .first<Record<string, string>>();
  if (!row) return null;

  const preset = PAST_LIFE_PRESETS.find((p) => p.id === row.preset_id);
  if (!preset) return null;

  return {
    id: row.id,
    userId: row.user_id,
    chartId: row.chart_id,
    preset,
    title: row.title,
    rarity: row.rarity as PastLifeRarity,
    camp: preset.camp,
    chartReasonShort: JSON.parse(row.result_json).chartReasonShort || "",
    shareToken: row.share_token,
    createdAt: row.created_at,
  };
}

export function buildPastLifeShareText(result: PastLifeResult, shareUrl: string): string {
  return [
    "我给你翻了一页旧账。",
    "",
    `你的前世身份是：「${result.title}」`,
    `稀有度：${RARITY_LABELS[result.rarity]}｜${RARITY_PERCENT[result.rarity]}`,
    "",
    result.preset.shortText,
    "",
    `点这里生成分享卡：`,
    shareUrl,
  ].join("\n");
}

export function buildPastLifeShareSvg(
  result: PastLifeResult,
  options: { shareUrl: string; baseUrl: string },
): string {
  const { preset } = result;
  const keywords = preset.keywords.slice(0, 4).join(" / ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0a0a1a"/>
      <stop offset="100%" stop-color="#1a1025"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#b8860b"/>
      <stop offset="50%" stop-color="#ffd700"/>
      <stop offset="100%" stop-color="#b8860b"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1080" height="1920" fill="url(#bg)"/>

  <!-- Decorative border -->
  <rect x="40" y="40" width="1000" height="1840" rx="24" fill="none" stroke="url(#gold)" stroke-width="2" opacity="0.4"/>

  <!-- Header -->
  <text x="540" y="280" text-anchor="middle" font-family="serif" font-size="48" fill="#d4a94d" font-weight="bold">我的前世反差身份</text>

  <!-- Title -->
  <text x="540" y="420" text-anchor="middle" font-family="serif" font-size="72" fill="#ffe8a3" font-weight="bold">${escapeXml(result.title)}</text>

  <!-- Rank -->
  <text x="540" y="490" text-anchor="middle" font-family="sans-serif" font-size="32" fill="#8a7a4b">${escapeXml(preset.rank)}</text>

  <!-- Rarity -->
  <text x="540" y="560" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#ffd700">${RARITY_LABELS[result.rarity]}｜${RARITY_PERCENT[result.rarity]}</text>

  <!-- Divider -->
  <line x1="300" y1="600" x2="780" y2="600" stroke="#d4a94d" stroke-width="1" opacity="0.5"/>

  <!-- Keywords -->
  <text x="540" y="660" text-anchor="middle" font-family="sans-serif" font-size="26" fill="#a0a0c0">今生残留：</text>
  <text x="540" y="710" text-anchor="middle" font-family="sans-serif" font-size="30" fill="#c0c0e0" font-weight="bold">${escapeXml(keywords)}</text>

  <!-- Chart reason -->
  <text x="540" y="800" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#7a6a5a">命盘依据：${escapeXml(result.chartReasonShort)}</text>

  <!-- Quote -->
  <text x="540" y="900" text-anchor="middle" font-family="serif" font-size="36" fill="#e0d0b0" font-style="italic">"${escapeXml(preset.shortText.slice(0, 60))}"</text>
  ${preset.shortText.length > 60 ? `<text x="540" y="950" text-anchor="middle" font-family="serif" font-size="36" fill="#e0d0b0" font-style="italic">"${escapeXml(preset.shortText.slice(60, 120))}"</text>` : ""}

  <!-- CTA -->
  <text x="540" y="1680" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#8a7a4b">扫码测你的前世身份</text>
  <text x="540" y="1730" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#5a5a7a">${escapeXml(options.shareUrl)}</text>

  <!-- Footer -->
  <text x="540" y="1860" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#4a4a6a">娱乐互动内容，不构成现实判断。</text>
</svg>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
