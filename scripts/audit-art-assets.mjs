#!/usr/bin/env node
import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { auditReportPath, publicAssetsDir } from "./art-assets.config.mjs";

const files = spawnSync(
  "find",
  [
    publicAssetsDir,
    "-type",
    "f",
    "(",
    "-iname",
    "*.png",
    "-o",
    "-iname",
    "*.webp",
    "-o",
    "-iname",
    "*.avif",
    "-o",
    "-iname",
    "*.svg",
    ")",
  ],
  { encoding: "utf8" },
);

if (files.status !== 0) {
  console.error(files.stderr);
  process.exit(files.status ?? 1);
}

function identify(path) {
  if (extname(path).toLowerCase() === ".svg") return { width: 0, height: 0 };
  const res = spawnSync("magick", ["identify", "-format", "%w %h", path], { encoding: "utf8" });
  if (res.status !== 0) return { width: 0, height: 0 };
  const [width, height] = res.stdout.trim().split(/\s+/).map(Number);
  return { width, height };
}

function category(path) {
  return relative(publicAssetsDir, path).split("/")[0] || "unknown";
}

function recommendation(path, bytes) {
  const rel = relative(publicAssetsDir, path);
  if (rel.includes("generated/") || rel.includes("critical/")) return "derived-output";
  if (bytes > 500_000 || extname(path).toLowerCase() === ".png")
    return "source-only-do-not-reference";
  if (rel.includes("thumb") || rel.includes("avatar")) return "candidate-existing-derived";
  return "audit-before-use";
}

const report = files.stdout
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((path) => {
    const stat = statSync(path);
    const dims = identify(path);
    const rel = relative(publicAssetsDir, path);
    return {
      path: rel,
      category: category(path),
      format: extname(path).slice(1).toLowerCase(),
      bytes: stat.size,
      width: dims.width,
      height: dims.height,
      overBudget: stat.size > 500_000,
      namingIssue: /ChatGPT Image|[() ]/.test(rel),
      recommendation: recommendation(path, stat.size),
    };
  });

mkdirSync(dirname(auditReportPath), { recursive: true });
writeFileSync(
  auditReportPath,
  `${JSON.stringify({ generatedAt: new Date().toISOString(), assets: report }, null, 2)}\n`,
);
console.log(`Audited ${report.length} assets -> ${auditReportPath}`);
