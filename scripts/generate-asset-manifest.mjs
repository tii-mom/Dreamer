#!/usr/bin/env node
import { mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { getMvpAssets, outputPathFor, sizeReportPath, variantSpecs } from "./art-assets.config.mjs";

function findBuiltFile(asset, variant) {
  const pending = outputPathFor(asset, variant);
  const dir = dirname(pending);
  const prefix = pending.split("/").pop().replace(".pending.webp", ".");
  try {
    return join(
      dir,
      readdirSync(dir).find((name) => name.startsWith(prefix) && name.endsWith(".webp")),
    );
  } catch {
    return null;
  }
}

function publicUrl(path) {
  const rel = relative("public", path);
  if (rel.startsWith("assets/critical/")) return `/${rel}`;
  return `/api/assets/${rel.replace(/^assets\/generated\//, "art/")}`;
}

function formatFor(path) {
  return path.endsWith(".webp")
    ? "webp"
    : path.endsWith(".avif")
      ? "avif"
      : path.endsWith(".svg")
        ? "svg"
        : "png";
}

const assets = await getMvpAssets();
const manifest = {};
const report = [];

for (const asset of assets) {
  const item = {
    id: asset.id,
    kind: asset.kind,
    rarity: asset.rarity,
    name: asset.name,
    specialty: asset.specialty,
    aspectRatio: asset.aspectRatio,
    dominantColor:
      asset.rarity === "chaos"
        ? "#141018"
        : asset.rarity === "tianshu" || asset.rarity === "gold"
          ? "#d7a94d"
          : asset.rarity === "dixuan"
            ? "#6d4bd1"
            : "#3158d4",
    variants: {},
  };
  for (const variant of asset.variants) {
    const built = findBuiltFile(asset, variant);
    if (!built) continue;
    const spec = variantSpecs[variant];
    const bytes = statSync(built).size;
    item.variants[variant] = {
      url: publicUrl(built),
      width: spec.width,
      height: spec.height,
      bytes,
      format: formatFor(built),
    };
    report.push({
      id: asset.id,
      kind: asset.kind,
      variant,
      bytes,
      budget: spec.budget,
      url: item.variants[variant].url,
    });
  }
  manifest[asset.id] = item;
}

const target = "src/lib/assets/asset-manifest.generated.ts";
mkdirSync(dirname(target), { recursive: true });
writeFileSync(
  target,
  `import type { AssetManifest } from "./asset-types";\n\nexport const assetManifest = ${JSON.stringify(manifest, null, 2)} as const satisfies AssetManifest;\n`,
);

mkdirSync(dirname(sizeReportPath), { recursive: true });
writeFileSync(
  sizeReportPath,
  `${JSON.stringify({ generatedAt: new Date().toISOString(), assets: report }, null, 2)}\n`,
);
console.log(`Generated ${target} with ${Object.keys(manifest).length} assets.`);
console.log(`Wrote ${sizeReportPath}.`);
