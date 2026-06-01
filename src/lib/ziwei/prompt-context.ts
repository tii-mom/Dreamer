import type { ZiweiChart } from "./types";
import { detectPatterns } from "./patterns";
import { BRANCHES, JU_NAMES, PALACE_NAMES_ORDER, STAR_DESCRIPTIONS, STEMS } from "./constants";

export type ZiweiPromptContext = {
  summary: string;
  compact: {
    mingGong: string;
    shenGong: string;
    wuxingJu: string;
    currentDaXian?: string;
    keyPalaces: Array<{
      name: string;
      branch: string;
      stars: string[];
      majorStars: string[];
      sihua: string[];
      warnings: string[];
    }>;
    patterns: Array<{
      name: string;
      level: string;
      description: string;
      source?: string;
    }>;
  };
};

function getSihuaLabels(stars: { name: string; siHua?: string; type: string }[]): string[] {
  const labels: string[] = [];
  for (const s of stars) {
    if (s.siHua) {
      labels.push(`${s.name}化${s.siHua}`);
    }
  }
  return labels;
}

function getWarnings(palace: {
  stars: { name: string; type: string; brightness?: string }[];
}): string[] {
  const w: string[] = [];
  for (const s of palace.stars) {
    if (s.type === "sha") w.push(`${s.name}煞`);
    if (s.brightness === "dim") w.push(`${s.name}落陷`);
  }
  return w;
}

function getDaXianAgeString(palace: { daXianAge?: [number, number] }): string {
  if (!palace.daXianAge) return "";
  return `${palace.daXianAge[0]}-${palace.daXianAge[1]}岁`;
}

export function buildZiweiPromptContext(
  chart: ZiweiChart,
  genderUnknown?: boolean,
): ZiweiPromptContext {
  const mingPalace = chart.palaces.find((p) => p.branch === chart.mingGongBranch);
  const shenPalace = chart.palaces.find((p) => p.branch === chart.shenGongBranch);
  const currentDx = chart.daXians[chart.currentDaXianIndex];
  const patterns = detectPatterns(chart);

  // Key palaces: 命宫, 财帛宫, 官禄宫, 夫妻宫, 福德宫, 迁移宫
  const keyPalaceNames = ["命宫", "财帛宫", "官禄宫", "夫妻宫", "福德宫", "迁移宫"];
  const keyPalaces = keyPalaceNames
    .map((name) => {
      const p = chart.palaces.find((p) => p.name === name);
      if (!p) return null;
      const majorStars = p.stars.filter((s) => s.type === "major");
      return {
        name: p.name,
        branch: BRANCHES[p.branch],
        stars: p.stars.map((s) => s.name),
        majorStars: majorStars.map((s) => s.name),
        sihua: getSihuaLabels(p.stars),
        warnings: getWarnings(p),
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  // Build compact summary (1500-2500 chars)
  const lines: string[] = [];

  // Header
  const genderText = chart.birthInfo.gender === "male" ? "男" : "女";
  const birthdayText = `${chart.birthInfo.year}年${chart.birthInfo.month}月${chart.birthInfo.day}日`;
  const hourText = BRANCHES[chart.birthInfo.hour] + "时";
  lines.push(`【紫微命盘摘要】出生：${birthdayText} ${hourText}（${genderText}）`);
  lines.push(
    `命宫：${BRANCHES[chart.mingGongBranch]} | 身宫：${BRANCHES[chart.shenGongBranch]} | 五行局：${chart.wuxingJuName}`,
  );
  if (currentDx) {
    lines.push(`当前大限：${currentDx.palaceName}（${currentDx.startAge}-${currentDx.endAge}岁）`);
  }

  // Ming gong stars
  if (mingPalace) {
    const mingMajor = mingPalace.stars.filter((s) => s.type === "major").map((s) => s.name);
    const mingAll = mingPalace.stars.map((s) => s.name);
    lines.push(
      `\n命宫（${BRANCHES[chart.mingGongBranch]}）：主星【${mingMajor.join("、") || "空宫"}】`,
    );
    if (mingPalace.isEmpty && mingPalace.borrowedStars) {
      lines.push(
        `  → 空宫，借对宫${mingPalace.borrowedName || ""}主星：${mingPalace.borrowedStars.join("、")}`,
      );
    }
    lines.push(`  全星：${mingAll.join("、")}`);
    const sihua = getSihuaLabels(mingPalace.stars);
    if (sihua.length) lines.push(`  四化：${sihua.join("、")}`);
    const mingWarnings = getWarnings(mingPalace);
    if (mingWarnings.length) lines.push(`  警示：${mingWarnings.join("、")}`);
  }

  // Key palaces detail
  for (const kp of keyPalaces) {
    if (kp.name === "命宫") continue;
    const parts = [`\n${kp.name}（${kp.branch}）：`];
    if (kp.majorStars.length) {
      parts.push(`主星【${kp.majorStars.join("、")}】`);
    } else {
      parts.push("空宫");
    }
    if (kp.sihua.length) parts.push(`四化：${kp.sihua.join("、")}`);
    if (kp.warnings.length) parts.push(`警示：${kp.warnings.join("、")}`);
    lines.push(parts.join(" "));
  }

  // Patterns
  if (patterns.length > 0) {
    lines.push(`\n【格局】`);
    for (const p of patterns) {
      const levelLabel: Record<string, string> = {
        excellent: "★上格",
        good: "☆中格",
        neutral: "○平格",
        caution: "⚠恶格",
      };
      lines.push(`${levelLabel[p.level] ?? ""} ${p.name}：${p.description}`);
    }
  } else {
    lines.push(`\n【格局】无明显特殊格局`);
  }

  // Gender warning
  if (genderUnknown) {
    lines.push("\n⚠ 性别未确认，部分判断需谨慎。");
  }

  const summary = lines.join("\n");

  // Compact structured data
  const compactPatterns = patterns.map((p) => ({
    name: p.name,
    level: p.level,
    description: p.description,
    source: p.source,
  }));

  return {
    summary,
    compact: {
      mingGong: BRANCHES[chart.mingGongBranch],
      shenGong: BRANCHES[chart.shenGongBranch],
      wuxingJu: chart.wuxingJuName,
      currentDaXian: currentDx
        ? `${currentDx.palaceName}（${currentDx.startAge}-${currentDx.endAge}岁）`
        : undefined,
      keyPalaces,
      patterns: compactPatterns,
    },
  };
}
