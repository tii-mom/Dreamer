import { readFileSync, writeFileSync } from "node:fs";

function patchFile(path, patcher) {
  const original = readFileSync(path, "utf8");
  const next = patcher(original);
  if (next !== original) {
    writeFileSync(path, next);
    console.log(`[launch-blockers] patched ${path}`);
  }
}

patchFile("src/lib/server/xms-bot.server.ts", (source) =>
  source.replace(
    /import \{\n  getOrCreateUserChart,\n  isBirthText,\n  parseBirthProfileFromText,\n  saveOrUpdateUserChart,\n\} from "\.\/xms-chart\.server";\n\nexport type BotMessage =/,
    "export type BotMessage =",
  ),
);

patchFile("src/lib/server/xms-service.server.ts", (source) => {
  let next = source.replace(
    /  getPaymentByOrderId,\n  getPaymentByAoid,\n\} from "\.\/xms-store\.server";/,
    '  getPaymentByOrderId,\n  getPaymentByAoid,\n  updatePaymentStatus,\n} from "./xms-store.server";',
  );

  next = next.replace(
    'import { md5 } from "./xms-payment.server";',
    'import { applyPaymentEntitlement, md5 } from "./xms-payment.server";',
  );

  return next;
});

patchFile("src/lib/server/xms-payment.server.ts", (source) =>
  source.replace(
    '  const adminToken = env.ADMIN_TOKEN || "admin_secret";\n\n  if (!token || token !== adminToken) {',
    '  const adminToken = env.ADMIN_TOKEN;\n\n  if (!adminToken) {\n    return new Response(JSON.stringify({ error: "Admin token is not configured" }), {\n      status: 503,\n      headers: { "Content-Type": "application/json" },\n    });\n  }\n\n  if (!token || token !== adminToken) {',
  ),
);
