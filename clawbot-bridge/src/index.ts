import { loadConfig } from "./config.js";
import { logger } from "./logger.js";
import { OpenClawClient } from "./openclaw-client.js";
import { DreamerClient } from "./dreamer-client.js";
import { ReconnectManager } from "./reconnect.js";

async function main() {
  logger.info("XMS ClawBot Bridge starting");

  const config = loadConfig();

  if (!config.openclaw.botToken) {
    logger.error(
      "OPENCLAW_BOT_TOKEN is not configured. Please set it via environment variable or config.local.json.",
    );
    logger.info(
      "To obtain a bot token: log in to OpenClaw/ClawBot, scan the WeChat QR code, and extract the token from the session.",
    );
    process.exit(1);
  }

  if (!config.dreamerBridgeSecret || config.dreamerBridgeSecret === "replace-with-secret") {
    logger.error("DREAMER_BRIDGE_SECRET is not configured.");
    process.exit(1);
  }

  logger.info("Configuration loaded", {
    dreamerApiBase: config.dreamerApiBase,
    botAgent: config.openclaw.botAgent,
  });

  const clawbot = new OpenClawClient(config.openclawApiBase, config.openclaw);
  const dreamer = new DreamerClient(config.dreamerApiBase, config.dreamerBridgeSecret);
  const reconnect = new ReconnectManager(config.runtime);

  let running = true;

  process.on("SIGINT", () => {
    logger.info("Received SIGINT, shutting down...");
    running = false;
  });
  process.on("SIGTERM", () => {
    logger.info("Received SIGTERM, shutting down...");
    running = false;
  });

  logger.info("Entering main poll loop");

  while (running) {
    try {
      reconnect.check();

      const messages = await clawbot.getUpdates();

      for (const msg of messages) {
        logger.info("Received message", {
          from: msg.providerUserId.slice(0, 16) + "...",
          messageId: msg.messageId,
          content: msg.content.slice(0, 50),
        });

        if (!msg.content.trim()) {
          logger.info("Skipping empty message");
          continue;
        }

        const rawType = Number(msg.rawPayload["message_type"] || msg.rawPayload["type"] || 2);
        if (rawType !== 2 && rawType !== 1) {
          logger.info("Non-text message, sending fallback", { type: rawType });
          await clawbot.sendMessage(
            msg.providerUserId,
            "戏命师目前先听文字，图片/语音以后再开。",
            msg.contextToken,
          );
          continue;
        }

        await clawbot.sendTyping(msg.providerUserId, msg.contextToken, 1);

        const maxRetries = 2;
        let result = await dreamer.sendToDreamer({
          providerUserId: msg.providerUserId,
          content: msg.content,
          messageId: msg.messageId,
          contextToken: msg.contextToken,
          rawPayload: msg.rawPayload,
        });

        for (let retry = 0; retry < maxRetries && !result.ok; retry++) {
          if (result.error === "signature rejected") break;
          logger.warn(`Dreamer retry ${retry + 1}/${maxRetries}`);
          await new Promise((r) => setTimeout(r, 1000));
          result = await dreamer.sendToDreamer({
            providerUserId: msg.providerUserId,
            content: msg.content,
            messageId: msg.messageId,
            contextToken: msg.contextToken,
            rawPayload: msg.rawPayload,
          });
        }

        if (result.ok && result.reply) {
          await clawbot.sendMessage(msg.providerUserId, result.reply, msg.contextToken);
          await clawbot.sendTyping(msg.providerUserId, msg.contextToken, 2);
        } else {
          const fallback =
            result.error === "signature rejected"
              ? "戏命师签名秘钥不匹配，请联系管理员。"
              : "戏命师刚才走神了，请再发一次。";
          await clawbot.sendMessage(msg.providerUserId, fallback, msg.contextToken);
        }
      }
    } catch (err) {
      logger.error("Main loop error", String(err));
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  logger.info("Bridge shut down. Uptime:", { minutes: reconnect.elapsedMinutes() });
}

main().catch((err) => {
  logger.error("Fatal error", String(err));
  process.exit(1);
});
