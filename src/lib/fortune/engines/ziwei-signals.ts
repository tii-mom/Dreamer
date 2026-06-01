import type { ZiweiChart } from "../../ziwei/types";
import type { FortuneSignal } from "../types";

const TOPICS: Record<string, FortuneSignal["topic"]> = {
  life: "personality",
  wealth: "wealth",
  career: "career",
  partner: "love",
  wellness: "health",
  travel: "travel",
};

const PALACES: Record<string, string> = {
  life: "命宫",
  wealth: "财帛宫",
  career: "官禄宫",
  partner: "夫妻宫",
  wellness: "福德宫",
  travel: "迁移宫",
};

export function buildZiweiSignals(chart: ZiweiChart): FortuneSignal[] {
  const signals: FortuneSignal[] = [];
  for (const key of Object.keys(PALACES)) {
    const palace = chart.palaces.find((item) => item.name === PALACES[key]);
    if (!palace) continue;
    const stars = palace.stars.map((item) => item.name);
    const majors = palace.stars.filter((item) => item.type === "major").map((item) => item.name);
    const bright = palace.stars.filter((item) => item.brightness === "bright").length;
    const dim = palace.stars.filter((item) => item.brightness === "dim").length;
    const score = Math.max(-100, Math.min(100, 20 + majors.length * 12 + bright * 6 - dim * 8));
    signals.push({
      id: `ziwei:${key}`,
      source: "ziwei",
      topic: TOPICS[key],
      title: `${key} signal`,
      evidence: `major stars: ${majors.join(", ") || "empty"}; stars: ${stars.slice(0, 8).join(", ")}`,
      score,
      weight: key === "life" ? 10 : 8,
      advice: score >= 0 ? "Take one small action with feedback." : "Observe first and keep room to adjust.",
      tags: stars.slice(0, 8),
    });
  }
  return signals;
}

export function emptyZiweiSignals(): FortuneSignal[] {
  return [];
}
