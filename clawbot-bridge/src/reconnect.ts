import { logger } from "./logger.js";

export interface ReconnectConfig {
  warningBeforeSeconds: number;
  forceReconnectBeforeSeconds: number;
  sessionDurationSeconds: number;
}

/**
 * MVP reconnect manager — manual mode only.
 *
 * Current implementation only logs warnings at pre-defined intervals.
 * Token refresh and automatic reconnection are NOT implemented in this version.
 *
 * To renew a session:
 *   1. Obtain a new bot token (re-scan QR / re-login via OpenClaw)
 *   2. Update OPENCLAW_BOT_TOKEN in config.local.json or environment
 *   3. Restart the Bridge: pm2 restart xms-clawbot-bridge
 */
export class ReconnectManager {
  private startTime: number;
  private warned3h = false;
  private warned2h = false;
  private warned30m = false;

  constructor(private config: ReconnectConfig) {
    this.startTime = Date.now();
    logger.info("Session started (manual reconnect mode)", {
      startTime: new Date(this.startTime).toISOString(),
      sessionDurationHours: Math.floor(this.config.sessionDurationSeconds / 3600),
    });
  }

  check(): void {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const remaining = this.config.sessionDurationSeconds - elapsed;

    const h3Limit = 3 * 3600;
    const h2Limit = this.config.warningBeforeSeconds;
    const m30Limit = this.config.forceReconnectBeforeSeconds;

    if (remaining <= m30Limit && !this.warned30m) {
      this.warned30m = true;
      logger.error(
        `⚠ SESSION EXPIRING SOON: ${Math.floor(remaining / 60)} minutes remaining. ` +
          `Please obtain a new bot token and restart the Bridge (pm2 restart xms-clawbot-bridge).`,
      );
    } else if (remaining <= h2Limit && !this.warned2h) {
      this.warned2h = true;
      logger.warn(
        `Session expires in ~${Math.floor(remaining / 3600)}h ${Math.floor((remaining % 3600) / 60)}m. ` +
          `Prepare a new bot token for renewal.`,
      );
    } else if (remaining <= h3Limit && !this.warned3h) {
      this.warned3h = true;
      logger.warn(
        `Session expires in ~${Math.floor(remaining / 3600)} hours. ` +
          `Plan to renew bot token soon.`,
      );
    }
  }

  reset(): void {
    this.startTime = Date.now();
    this.warned3h = false;
    this.warned2h = false;
    this.warned30m = false;
    logger.info("Session reset (manual mode)", {
      startTime: new Date(this.startTime).toISOString(),
    });
  }

  elapsedMinutes(): number {
    return Math.floor((Date.now() - this.startTime) / 60000);
  }
}
