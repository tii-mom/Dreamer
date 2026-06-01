import { logger } from "./logger.js";

export interface ReconnectConfig {
  warningBeforeSeconds: number;
  forceReconnectBeforeSeconds: number;
  sessionDurationSeconds: number;
}

export class ReconnectManager {
  private startTime: number;
  private warned = false;
  private forcedWarned = false;

  constructor(private config: ReconnectConfig) {
    this.startTime = Date.now();
    logger.info("Session started", { startTime: new Date(this.startTime).toISOString() });
  }

  check(): { shouldWarn: boolean; shouldReconnect: boolean } {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const remaining = this.config.sessionDurationSeconds - elapsed;

    const shouldWarn = remaining <= this.config.warningBeforeSeconds && !this.warned;
    const shouldReconnect =
      remaining <= this.config.forceReconnectBeforeSeconds && !this.forcedWarned;

    if (shouldWarn) {
      this.warned = true;
      logger.warn(
        `Session expiring in ${Math.floor(remaining / 60)} minutes. Please prepare to reconnect.`,
      );
    }

    if (shouldReconnect) {
      this.forcedWarned = true;
      logger.error(
        `Session expiring in ${Math.floor(remaining / 60)} minutes. Reconnect required.`,
      );
    }

    return { shouldWarn, shouldReconnect };
  }

  reset(): void {
    this.startTime = Date.now();
    this.warned = false;
    this.forcedWarned = false;
    logger.info("Session reset", { startTime: new Date(this.startTime).toISOString() });
  }

  elapsedMinutes(): number {
    return Math.floor((Date.now() - this.startTime) / 60000);
  }
}
