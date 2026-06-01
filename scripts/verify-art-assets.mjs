#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { sizeReportPath, variantSpecs } from "./art-assets.config.mjs";

const failures = [];

function rg(pattern, paths) {
  return spawnSync("rg", ["-n", pattern, ...paths], { encoding: "utf8" });
}

const directAssets = rg("[\"\\']\\/assets\\/(?!critical\\/|generated\\/)", ["src"]);
if (directAssets.status === 0) {
  failures.push(`Components contain direct /assets paths:\n${directAssets.stdout}`);
}

const listLarge = rg("<AssetImage[^\\n]*(variant=\\{?[\"\\'](?:card|full)[\"\\']", [
  "src/components",
  "src/routes",
]);
if (listLarge.status === 0) {
  failures.push(
    `Potential list/detail violation: card/full variants must be user-triggered:\n${listLarge.stdout}`,
  );
}

const botBase64 = rg("data:image/.+base64|base64", ["src/lib/server/xms-bot.server.ts"]);
if (botBase64.status === 0) {
  failures.push(`Wechat bot must not return base64 image payloads:\n${botBase64.stdout}`);
}

let report;
try {
  report = JSON.parse(readFileSync(sizeReportPath, "utf8")).assets;
} catch {
  failures.push(`Missing ${sizeReportPath}. Run npm run art:build && npm run art:manifest first.`);
  report = [];
}

for (const row of report) {
  const spec = variantSpecs[row.variant];
  if (!row.bytes || !row.url || !spec)
    failures.push(`Incomplete manifest row: ${JSON.stringify(row)}`);
  if (spec?.budget && row.bytes > spec.budget) {
    failures.push(`${row.id}:${row.variant} is ${row.bytes}B, budget ${spec.budget}B`);
  }
}

const critical = report.filter((row) => row.url.startsWith("/assets/critical/"));
const homeCritical = critical.filter((row) =>
  ["master_avatar.trainee.01", "ui.coin", "ui.ticket", "ui.loading_oracle"].includes(row.id),
);
const homeBytes = homeCritical.reduce((sum, row) => sum + row.bytes, 0);
if (homeCritical.length > 5)
  failures.push(`Home critical image count ${homeCritical.length} exceeds 5.`);
if (homeBytes > 300_000) failures.push(`Home critical image bytes ${homeBytes} exceeds 300000.`);

const blindboxFirst = report.filter(
  (row) => row.id === "blind_box.box.standard" || row.id.startsWith("blind_box.frame."),
);
const blindboxBytes = blindboxFirst.reduce((sum, row) => sum + row.bytes, 0);
if (blindboxBytes > 800_000)
  failures.push(`Blind box first image bytes ${blindboxBytes} exceeds 800000.`);

if (failures.length) {
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log("art:verify passed");
console.log(`Home critical: ${homeCritical.length} requests, ${homeBytes} bytes`);
console.log(`Blind box first-load budget: ${blindboxBytes} bytes`);
