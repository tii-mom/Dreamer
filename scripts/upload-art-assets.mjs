#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { sizeReportPath } from "./art-assets.config.mjs";

if (!existsSync(sizeReportPath)) {
  console.error(`Missing ${sizeReportPath}. Run npm run art:manifest first.`);
  process.exit(1);
}

const report = JSON.parse(readFileSync(sizeReportPath, "utf8")).assets;
const remote = report.filter((row) => row.url.startsWith("/api/assets/art/"));
let count = 0;

for (const row of remote) {
  const local = row.url.replace("/api/assets/art/", "public/assets/generated/");
  const key = row.url.replace("/api/assets/", "");
  if (!existsSync(local)) {
    console.error(`Missing local file for ${row.url}: ${local}`);
    process.exit(1);
  }
  const res = spawnSync(
    "wrangler",
    [
      "r2",
      "object",
      "put",
      `xms-dialogue-game-assets/${key}`,
      "--file",
      local,
      "--content-type",
      "image/webp",
      "--remote",
    ],
    {
      stdio: "inherit",
    },
  );
  if (res.status !== 0) process.exit(res.status ?? 1);
  count += 1;
}

console.log(`Uploaded ${count} art assets to R2.`);
