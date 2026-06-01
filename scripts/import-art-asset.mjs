#!/usr/bin/env node
import { existsSync, mkdirSync } from "node:fs";
import { copyFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const [sourceArg, targetArg] = process.argv.slice(2);

if (!sourceArg || !targetArg) {
  console.error(
    "Usage: node scripts/import-art-asset.mjs <source-image> <public/assets/.../name.webp>",
  );
  process.exit(1);
}

const source = resolve(sourceArg);
const target = resolve(targetArg);

if (!existsSync(source)) {
  console.error(`Source file not found: ${source}`);
  process.exit(1);
}

if (!target.includes("/public/assets/") || extname(target).toLowerCase() !== ".webp") {
  console.error("Target must be a .webp file under public/assets/");
  process.exit(1);
}

mkdirSync(dirname(target), { recursive: true });

const pngTarget = target.replace(/\.webp$/i, ".png");
await copyFile(source, pngTarget);

const cwebp = spawnSync("cwebp", ["-q", "88", pngTarget, "-o", target], {
  encoding: "utf8",
});

if (cwebp.status !== 0) {
  console.error(cwebp.stderr || cwebp.stdout);
  console.error(`PNG source was still copied to: ${pngTarget}`);
  process.exit(cwebp.status ?? 1);
}

console.log(`Imported source: ${pngTarget}`);
console.log(`Created web asset: ${target}`);
