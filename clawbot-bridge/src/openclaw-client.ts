import { randomBytes } from "node:crypto";
import { logger } from "./logger.js";

export interface OpenClawConfig {
  botToken: string;
  channelVersion: string;
  clientVersion: string;
  botAgent: string;
}

export interface IncomingMessage {
  providerUserId: string;
  content: string;
  messageId: string;
  contextToken: string;
  rawPayload: Record<string, unknown>;
}

export class OpenClawClient {
  private baseUrl = "https://openclaw.ai/api/v1/bot";

  constructor(private config: OpenClawConfig) {}

  private get authHeaders(): Record<string, string> {
    return {
      authorization: `Bearer ${this.config.botToken}`,
      "content-type": "application/json",
    };
  }

  private generateClientId(): string {
    return `openclaw-weixin-${randomBytes(8).toString("hex")}`;
  }

  async getUpdates(): Promise<IncomingMessage[]> {
    const messages: IncomingMessage[] = [];

    try {
      const resp = await fetch(`${this.baseUrl}/getupdates?timeout=${35}`, {
        headers: this.authHeaders,
      });

      if (!resp.ok) {
        logger.error(`getupdates failed: HTTP ${resp.status}`);
        return messages;
      }

      const data = (await resp.json()) as {
        updates?: Array<Record<string, unknown>>;
      };

      if (!data.updates?.length) return messages;

      for (const update of data.updates) {
        try {
          const msg = this.parseUpdate(update);
          if (msg) messages.push(msg);
        } catch (err) {
          logger.warn("Failed to parse update", { error: String(err), update });
        }
      }
    } catch (err) {
      logger.error("getupdates network error", String(err));
    }

    return messages;
  }

  private parseUpdate(update: Record<string, unknown>): IncomingMessage | null {
    const from = String(update["from_user_id"] || update["from"] || "");
    const text = String(update["text"] || update["content"] || "");
    const messageId = String(update["message_id"] || update["messageId"] || "");
    const contextToken = String(update["context_token"] || update["contextToken"] || "");

    if (!from || !text) return null;

    return {
      providerUserId: from,
      content: text,
      messageId,
      contextToken,
      rawPayload: update,
    };
  }

  async sendTyping(toUserId: string, contextToken: string, status: 1 | 2): Promise<boolean> {
    try {
      const body = {
        msg: {
          from_user_id: "",
          to_user_id: toUserId,
          client_id: this.generateClientId(),
          message_type: 3,
          message_state: status,
          context_token: contextToken,
          item_list: [
            {
              type: 1,
              text_item: { text: "" },
            },
          ],
        },
        base_info: {
          channel_version: this.config.channelVersion,
          bot_agent: this.config.botAgent,
        },
      };

      const resp = await fetch(`${this.baseUrl}/sendtyping`, {
        method: "POST",
        headers: this.authHeaders,
        body: JSON.stringify(body),
      });

      return resp.ok;
    } catch (err) {
      logger.warn("sendTyping failed", String(err));
      return false;
    }
  }

  async sendMessage(toUserId: string, text: string, contextToken: string): Promise<boolean> {
    try {
      const body = {
        msg: {
          from_user_id: "",
          to_user_id: toUserId,
          client_id: this.generateClientId(),
          message_type: 2,
          message_state: 2,
          context_token: contextToken,
          item_list: [
            {
              type: 1,
              text_item: { text },
            },
          ],
        },
        base_info: {
          channel_version: this.config.channelVersion,
          bot_agent: this.config.botAgent,
        },
      };

      const resp = await fetch(`${this.baseUrl}/sendmessage`, {
        method: "POST",
        headers: this.authHeaders,
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        logger.warn(`sendMessage failed: HTTP ${resp.status}`);
        return false;
      }

      const data = (await resp.json()) as Record<string, unknown>;
      logger.info("sendMessage success", { toUserId: toUserId.slice(0, 12) + "..." });
      return true;
    } catch (err) {
      logger.error("sendMessage error", String(err));
      return false;
    }
  }
}
