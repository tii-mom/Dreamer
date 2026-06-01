import { readFileSync } from "node:fs";

export interface BridgeConfig {
  dreamerApiBase: string;
  dreamerBridgeSecret: string;
  openclaw: {
    botToken: string;
    channelVersion: string;
    clientVersion: string;
    botAgent: string;
  };
  runtime: {
    pollTimeoutSeconds: number;
    sessionDurationSeconds: number;
    warningBeforeSeconds: number;
    forceReconnectBeforeSeconds: number;
  };
}

function loadJsonFile(path: string): Record<string, unknown> | null {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

export function loadConfig(): BridgeConfig {
  const defaults = loadJsonFile("config.example.json") as Partial<BridgeConfig>;
  const local = loadJsonFile("config.local.json") as Partial<BridgeConfig>;

  return {
    dreamerApiBase:
      process.env["DREAMER_API_BASE"] ||
      local?.dreamerApiBase ||
      defaults?.dreamerApiBase ||
      "https://bige.life",
    dreamerBridgeSecret:
      process.env["DREAMER_BRIDGE_SECRET"] ||
      local?.dreamerBridgeSecret ||
      defaults?.dreamerBridgeSecret ||
      "",
    openclaw: {
      botToken:
        process.env["OPENCLAW_BOT_TOKEN"] ||
        local?.openclaw?.botToken ||
        defaults?.openclaw?.botToken ||
        "",
      channelVersion:
        process.env["OPENCLAW_CHANNEL_VERSION"] ||
        local?.openclaw?.channelVersion ||
        defaults?.openclaw?.channelVersion ||
        "2.4.3",
      clientVersion: local?.openclaw?.clientVersion || defaults?.openclaw?.clientVersion || "2.4.3",
      botAgent:
        local?.openclaw?.botAgent || defaults?.openclaw?.botAgent || "xms-clawbot-bridge/0.1.0",
    },
    runtime: {
      pollTimeoutSeconds:
        Number(process.env["POLL_TIMEOUT_SECONDS"]) ||
        local?.runtime?.pollTimeoutSeconds ||
        defaults?.runtime?.pollTimeoutSeconds ||
        35,
      sessionDurationSeconds:
        Number(process.env["SESSION_DURATION_SECONDS"]) ||
        local?.runtime?.sessionDurationSeconds ||
        defaults?.runtime?.sessionDurationSeconds ||
        86400,
      warningBeforeSeconds:
        Number(process.env["WARNING_BEFORE_SECONDS"]) ||
        local?.runtime?.warningBeforeSeconds ||
        defaults?.runtime?.warningBeforeSeconds ||
        7200,
      forceReconnectBeforeSeconds:
        Number(process.env["FORCE_RECONNECT_BEFORE_SECONDS"]) ||
        local?.runtime?.forceReconnectBeforeSeconds ||
        defaults?.runtime?.forceReconnectBeforeSeconds ||
        1800,
    },
  };
}
