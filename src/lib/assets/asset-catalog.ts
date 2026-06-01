export type Rarity = "normal" | "rare" | "epic" | "legendary";

export type EffectType =
  | "money_prompt_boost"
  | "love_prompt_boost"
  | "work_prompt_boost"
  | "daily_prompt_boost"
  | "inscription_prompt_boost"
  | "toxicity_boost"
  | "wisdom_boost";

export type AssetCatalogItem = {
  assetCode: string;
  assetType: "inscription" | "master";
  rarity: Rarity;
  name: string;
  description: string;
  manifestAssetId: string;
  effectType: EffectType;
  effectDescription: string;
  drawWeight: number;
};

/**
 * Asset catalog: single source of truth for all blindbox-eligible assets.
 * drawWeight determines probability within its rarity tier.
 */
export const ASSET_CATALOG: AssetCatalogItem[] = [
  {
    assetCode: "taohua_rune",
    assetType: "inscription",
    rarity: "normal",
    name: "桃花铭文",
    description: "增强感情/姻缘话题推演能力",
    manifestAssetId: "rune.normal.01",
    effectType: "love_prompt_boost",
    effectDescription: "感情话题推演深度 +15%",
    drawWeight: 35,
  },
  {
    assetCode: "caibo_rune",
    assetType: "inscription",
    rarity: "normal",
    name: "财帛铭文",
    description: "增强财运/副业话题推演能力",
    manifestAssetId: "rune.normal.02",
    effectType: "money_prompt_boost",
    effectDescription: "财运话题推演深度 +15%",
    drawWeight: 35,
  },
  {
    assetCode: "wencheng_rune",
    assetType: "inscription",
    rarity: "rare",
    name: "文昌铭文",
    description: "增强朋友圈文案生成能力",
    manifestAssetId: "rune.rare.01",
    effectType: "daily_prompt_boost",
    effectDescription: "日常话题推演深度 +25%",
    drawWeight: 40,
  },
  {
    assetCode: "tianji_rune",
    assetType: "inscription",
    rarity: "rare",
    name: "天机铭文",
    description: "增强命盘解释与推演精度",
    manifestAssetId: "rune.rare.02",
    effectType: "wisdom_boost",
    effectDescription: "推演精准度 +25%",
    drawWeight: 40,
  },
  {
    assetCode: "wuxu_rune",
    assetType: "inscription",
    rarity: "epic",
    name: "武曲贪狼印",
    description: "增强财帛/经营话题能力，附带毒舌加成",
    manifestAssetId: "rune.epic.01",
    effectType: "money_prompt_boost",
    effectDescription: "经营话题推演深度 +40%，附带毒舌加成",
    drawWeight: 50,
  },
  {
    assetCode: "pofeng_rune",
    assetType: "inscription",
    rarity: "epic",
    name: "破军铭文",
    description: "回复更毒舌犀利，但不越界",
    manifestAssetId: "rune.epic.02",
    effectType: "toxicity_boost",
    effectDescription: "毒舌回复概率 +40%",
    drawWeight: 50,
  },
  {
    assetCode: "rune.gold.01",
    assetType: "inscription",
    rarity: "legendary",
    name: "武曲贪狼金印",
    description: "传说级铭文，全面增强经营推演与毒舌能力",
    manifestAssetId: "rune.gold.01",
    effectType: "money_prompt_boost",
    effectDescription: "全面推演增强 +60%，毒舌 +20%",
    drawWeight: 50,
  },
  {
    assetCode: "rune.legendary.01",
    assetType: "inscription",
    rarity: "legendary",
    name: "混元天机印",
    description: "传说级铭文，全类型话题推演大幅增强",
    manifestAssetId: "rune.gold.01",
    effectType: "wisdom_boost",
    effectDescription: "全类型推演大幅增强 +60%",
    drawWeight: 50,
  },
];

/** Get rarity draw probabilities (sums to 100) */
export function getRarityProbabilities(): Record<Rarity, number> {
  return {
    normal: 50,
    rare: 30,
    epic: 15,
    legendary: 5,
  };
}

/** Pick an asset from a rarity tier by draw weight */
function pickAssetByTier(rarity: Rarity): AssetCatalogItem {
  const pool = ASSET_CATALOG.filter((a) => a.rarity === rarity);
  const totalWeight = pool.reduce((sum, a) => sum + a.drawWeight, 0);
  let roll = Math.random() * totalWeight;
  for (const asset of pool) {
    roll -= asset.drawWeight;
    if (roll <= 0) return asset;
  }
  return pool[0];
}

export type DrawResult = {
  assetCode: string;
  assetType: string;
  rarity: string;
  name: string;
  manifestAssetId: string;
  effectType: string;
  effectDescription: string;
};

/**
 * Perform a single draw based on rarity probabilities and asset weights.
 */
export function performSingleDraw(): DrawResult {
  const probabilities = getRarityProbabilities();
  const roll = Math.random() * 100;
  let cumulative = 0;
  let chosenRarity: Rarity = "normal";

  for (const [rarity, prob] of Object.entries(probabilities)) {
    cumulative += prob;
    if (roll <= cumulative) {
      chosenRarity = rarity as Rarity;
      break;
    }
  }

  const asset = pickAssetByTier(chosenRarity);
  return {
    assetCode: asset.assetCode,
    assetType: asset.assetType,
    rarity: asset.rarity,
    name: asset.name,
    manifestAssetId: asset.manifestAssetId,
    effectType: asset.effectType,
    effectDescription: asset.effectDescription,
  };
}

/**
 * Perform multiple draws (for ten-pull).
 * Guarantees at least one epic or better on ten-pull.
 */
export function performMultiDraw(count: number): DrawResult[] {
  const results: DrawResult[] = [];
  for (let i = 0; i < count; i++) {
    results.push(performSingleDraw());
  }

  // Ten-pull guarantee: at least one epic or better
  if (count >= 10) {
    const hasEpicOrBetter = results.some((r) => r.rarity === "epic" || r.rarity === "legendary");
    if (!hasEpicOrBetter) {
      // Replace last result with an epic
      results[results.length - 1] = {
        ...performSingleDraw(),
        rarity: "epic",
      };
    }
  }

  return results;
}
