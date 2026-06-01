import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

export const publicAssetsDir = "public/assets";
export const generatedRoot = "public/assets/generated";
export const criticalRoot = "public/assets/critical";
export const auditReportPath = "art-source/audit-report.json";
export const sizeReportPath = "art-source/asset-size-report.json";

const masterNames = {
  trainee: ["命由天瞳"],
  renji: [
    "人玑命师 · 灵签童子",
    "人玑命师 · 星座塔罗",
    "人玑命师 · 流日书记",
    "人玑命师 · 梦占侍者",
    "人玑命师 · 小六壬客",
    "人玑命师 · 梅花易数",
    "人玑命师 · 签筒守夜",
    "人玑命师 · 情缘问卜",
    "人玑命师 · 财星巡游",
    "人玑命师 · 八字初判",
    "人玑命师 · 紫微灯使",
    "人玑命师 · 日课行者",
  ],
  dixuan: [
    "地璇命师 · 合婚画司",
    "地璇命师 · 风水择日",
    "地璇命师 · 事业星官",
    "地璇命师 · 财帛掌簿",
    "地璇命师 · 流年推官",
    "地璇命师 · 宅运策士",
    "地璇命师 · 桃花判客",
    "地璇命师 · 奇门隐者",
  ],
  tianshu: [
    "天枢命师 · 北斗执笔",
    "天枢命师 · 紫微帝座",
    "天枢命师 · 天机策令",
    "天枢命师 · 金阙司命",
  ],
  chaos: ["混沌命师 · 鸿蒙未判"],
};

const runeNames = {
  silver: ["角木蛟印", "心月狐契", "井木犴纹", "参水猿箓", "壁水貐篆", "斗木獬符"],
  gold: ["武曲贪狼印", "天梁化禄符", "紫微帝座铭", "太阴照命契"],
  chaos: ["盘古开天印", "鸿蒙未判契"],
};

const rarityCounts = { trainee: 1, renji: 12, dixuan: 8, tianshu: 4, chaos: 1 };

function two(n) {
  return String(n).padStart(2, "0");
}

async function sortedFiles(dir, predicate = () => true) {
  if (!existsSync(dir)) return [];
  const names = await readdir(dir);
  return names
    .filter((name) => !name.startsWith("."))
    .filter(predicate)
    .sort((a, b) => a.localeCompare(b, "zh-Hans-CN"))
    .map((name) => join(dir, name));
}

export async function getMvpAssets() {
  const assets = [];

  for (const [rarity, count] of Object.entries(rarityCounts)) {
    for (let i = 1; i <= count; i += 1) {
      const slug = `${rarity}-${two(i)}`;
      const card = join(publicAssetsDir, "masters", rarity, `${slug}-card.png`);
      const avatarPng = join(publicAssetsDir, "masters", rarity, `${slug}-avatar.png`);
      const avatarWebp = join(publicAssetsDir, "masters", rarity, `${slug}-avatar.webp`);
      assets.push({
        id: `master.${rarity}.${two(i)}`,
        kind: "master",
        rarity,
        name: masterNames[rarity][i - 1] ?? `${rarity} ${two(i)}`,
        specialty: rarity === "trainee" ? "紫微斗数 / 八字 / 每日问事" : "命理推演",
        aspectRatio: 2 / 3,
        source: card,
        variants: ["thumb", "list", "card", "full"],
      });
      assets.push({
        id: `master_avatar.${rarity}.${two(i)}`,
        kind: "master_avatar",
        rarity,
        name: `${masterNames[rarity][i - 1] ?? `${rarity} ${two(i)}`}头像`,
        aspectRatio: 1,
        source: existsSync(avatarPng) ? avatarPng : avatarWebp,
        critical: rarity === "trainee" && i === 1,
        variants: ["avatar_sm", "avatar_md", "avatar_lg", "raw"],
      });
    }
  }

  const boxFiles = await sortedFiles(join(publicAssetsDir, "blind-box", "box"), (name) =>
    /\.(png|webp|avif)$/i.test(name),
  );
  const boxIds = ["standard", "renji", "dixuan", "tianshu", "chaos"];
  boxFiles.slice(0, 5).forEach((source, index) => {
    assets.push({
      id: `blind_box.box.${boxIds[index]}`,
      kind: "blind_box",
      rarity: boxIds[index] === "standard" ? undefined : boxIds[index],
      name: `戏命师盲盒 · ${boxIds[index]}`,
      aspectRatio: 1,
      source,
      variants: ["box"],
    });
  });

  const frameFiles = await sortedFiles(join(publicAssetsDir, "blind-box", "opening"), (name) =>
    /\.(png|webp|avif)$/i.test(name),
  );
  frameFiles.slice(0, 6).forEach((source, index) => {
    assets.push({
      id: `blind_box.frame.${two(index + 1)}`,
      kind: "blind_box_effect",
      name: `开盒序列帧 ${two(index + 1)}`,
      aspectRatio: 1,
      source,
      variants: ["frame"],
    });
  });

  const resultFiles = await sortedFiles(join(publicAssetsDir, "blind-box", "results"), (name) =>
    /\.(png|webp|avif)$/i.test(name),
  );
  ["renji", "dixuan", "tianshu", "chaos"].forEach((rarity, index) => {
    if (!resultFiles[index]) return;
    assets.push({
      id: `blind_box.result.${rarity}`,
      kind: "blind_box_result",
      rarity,
      name: `抽中结果背景 · ${rarity}`,
      aspectRatio: 9 / 16,
      source: resultFiles[index],
      variants: ["mobile", "share"],
    });
  });

  for (const rarity of ["silver", "gold", "chaos"]) {
    const files = await sortedFiles(join(publicAssetsDir, "runes", rarity), (name) =>
      /\.(png|webp|avif)$/i.test(name),
    );
    files.slice(0, runeNames[rarity].length).forEach((source, index) => {
      assets.push({
        id: `rune.${rarity}.${two(index + 1)}`,
        kind: "rune",
        rarity,
        name: runeNames[rarity][index],
        aspectRatio: 1,
        source,
        variants: ["icon", "thumb", "card", "raw"],
      });
    });
  }

  const shareFiles = await sortedFiles(join(publicAssetsDir, "share"), (name) =>
    /\.(png|webp|avif)$/i.test(name),
  );
  ["daily", "seal", "earn", "box_result"].forEach((slug, index) => {
    if (!shareFiles[index]) return;
    assets.push({
      id: `share.${slug}`,
      kind: "share",
      name: `分享卡背景 · ${slug}`,
      aspectRatio: 9 / 16,
      source: shareFiles[index],
      variants: ["mobile", "share"],
    });
  });

  const uiFiles = await sortedFiles(join(publicAssetsDir, "ui"), (name) =>
    /\.(png|webp|avif)$/i.test(name),
  );
  const uiIds = ["coin", "ticket", "loading_oracle"];
  uiFiles.slice(0, 3).forEach((source, index) => {
    assets.push({
      id: `ui.${uiIds[index]}`,
      kind: "ui",
      name: `UI ${uiIds[index]}`,
      aspectRatio: 1,
      source,
      critical: true,
      variants: ["icon"],
    });
  });

  return assets.filter((asset) => asset.source && existsSync(asset.source));
}

export const variantSpecs = {
  thumb: { width: 240, height: 360, quality: 78, budget: 45_000, target: "r2" },
  list: { width: 320, height: 480, quality: 78, budget: 80_000, target: "r2" },
  card: { width: 720, height: 1080, quality: 48, budget: 180_000, target: "r2" },
  full: { width: 1024, height: 1536, quality: 58, budget: 350_000, target: "r2" },
  avatar_sm: { width: 64, height: 64, quality: 78, budget: 8_000, target: "critical" },
  avatar_md: { width: 96, height: 96, quality: 78, budget: 15_000, target: "critical" },
  avatar_lg: { width: 192, height: 192, quality: 80, budget: 35_000, target: "r2" },
  raw: { width: 512, height: 512, quality: 70, budget: 90_000, target: "r2" },
  icon: { width: 96, height: 96, quality: 78, budget: 15_000, target: "critical" },
  box: { width: 512, height: 512, quality: 80, budget: 90_000, target: "r2" },
  frame: { width: 512, height: 512, quality: 72, budget: 80_000, target: "r2" },
  mobile: { width: 720, height: 1280, quality: 78, budget: 220_000, target: "r2" },
  share: { width: 1080, height: 1920, quality: 82, budget: 380_000, target: "r2" },
};

export function slugForAsset(asset) {
  return asset.id.replaceAll(".", "-").replaceAll("_", "-");
}

export function outputPathFor(asset, variant, hash = "pending") {
  const spec = variantSpecs[variant];
  const root = spec.target === "critical" && asset.critical ? criticalRoot : generatedRoot;
  return join(root, asset.kind, `${slugForAsset(asset)}-${variant}-${spec.width}.${hash}.webp`);
}
