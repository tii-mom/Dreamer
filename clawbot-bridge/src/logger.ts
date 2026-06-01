export function log(level: "info" | "warn" | "error", message: string, data?: unknown) {
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${level.toUpperCase()}]`;
  const safeData = data ? " " + JSON.stringify(sanitize(data)) : "";
  console.log(`${prefix} ${message}${safeData}`);
}

function sanitize(obj: unknown): unknown {
  if (typeof obj !== "object" || obj === null) return obj;
  const copy: Record<string, unknown> = { ...(obj as Record<string, unknown>) };
  const maskKeys = [
    "botToken",
    "bot_token",
    "dreamerBridgeSecret",
    "bridge_secret",
    "secret",
    "token",
  ];
  for (const key of Object.keys(copy)) {
    if (maskKeys.includes(key)) copy[key] = "***";
  }
  return copy;
}

export const logger = {
  info: (msg: string, data?: unknown) => log("info", msg, data),
  warn: (msg: string, data?: unknown) => log("warn", msg, data),
  error: (msg: string, data?: unknown) => log("error", msg, data),
};
