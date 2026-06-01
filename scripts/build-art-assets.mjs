#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, renameSync, rmSync, statSync } from "node:fs";
import { dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { getMvpAssets, outputPathFor, variantSpecs } from "./art-assets.config.mjs";

function hashFile(path) {
  const res = spawnSync("shasum", ["-a", "256", path], { encoding: "utf8" });
  if (res.status === 0) return res.stdout.slice(0, 10);
  return createHash("sha256").update(path).digest("hex").slice(0, 10);
}

function convert(source, target, spec) {
  mkdirSync(dirname(target), { recursive: true });
  const args = [
    source,
    "-auto-orient",
    "-resize",
    `${spec.width}x${spec.height}^`,
    "-gravity",
    "center",
    "-extent",
    `${spec.width}x${spec.height}`,
    "-strip",
    "-quality",
    String(spec.quality),
    target,
  ];
  const res = spawnSync("magick", args, { encoding: "utf8" });
  if (res.status !== 0) {
    throw new Error(res.stderr || res.stdout || `Failed to convert ${source}`);
  }
}

rmSync("public/assets/generated", { recursive: true, force: true });
rmSync("public/assets/critical", { recursive: true, force: true });

const assets = await getMvpAssets();
let count = 0;
for (const asset of assets) {
  for (const variant of asset.variants) {
    const spec = variantSpecs[variant];
    if (!spec || !existsSync(asset.source)) continue;
    const pending = outputPathFor(asset, variant);
    convert(asset.source, pending, spec);
    const hash = hashFile(pending);
    const finalPath = outputPathFor(asset, variant, hash);
    renameSync(pending, finalPath);
    const bytes = statSync(finalPath).size;
    count += 1;
    console.log(`${asset.id}:${variant} ${bytes}B -> ${finalPath}`);
  }
}

console.log(`Built ${count} derived art assets.`);
