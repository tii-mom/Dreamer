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

function randomUin(): string {
  const u32 = (Math.floor(Math.random() * 0xffffffff) >>> 0).toString();
  return Buffer.from(u32).toString("base64");
}

export class OpenClawClient {
  private baseUrl: string;
  private typingTicketCache: { ticket: string; expiresAt: number } | null = null;

  constructor(
    apiBase: string,
    private config: OpenClawConfig,
  ) {
    this.baseUrl = apiBase.replace(/\/$/, "");
  }

  private headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      AuthorizationType: "ilink_bot_token",
      "X-WECHAT-UIN": randomUin(),
      "iLink-App-Id": "bot",
      "iLink-App-ClientVersion": this.config.clientVersion,
      Authorization: `Bearer ${this.config.botToken}`,
    };
  }

  // ── getUpdates ──

  async getUpdates(): Promise<IncomingMessage[]> {
    const messages: IncomingMessage[] = [];

    try {
      const resp = await fetch(`${this.baseUrl}/getupdates`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({ timeout: 35 }),
        signal: AbortSignal.timeout(40_000),
      });

      if (!resp.ok) {
        logger.error(`getupdates failed: HTTP ${resp.status}`);
        return messages;
      }

      const data = (await resp.json()) as {
        updates?: Array<Record<string, unknown>>;
        messages?: Array<Record<string, unknown>>;
        data?: Array<Record<string, unknown>>;
      };

      const list = data.updates || data.messages || data.data || [];

      for (const update of list) {
        try {
          const msg = this.parseUpdate(update);
          if (msg) messages.push(msg);
        } catch (err) {
          logger.warn("Failed to parse update", { error: String(err) });
        }
      }
    } catch (err) {
      logger.warn("getupdates network error", String(err));
    }

    return messages;
  }

  private parseUpdate(update: Record<string, unknown>): IncomingMessage | null {
    const from = String(update["from_user_id"] || update["from"] || update["fromUserId"] || "");
    const contextToken = String(update["context_token"] || update["contextToken"] || "");
    const messageId = String(update["message_id"] || update["messageId"] || "");

    let text = String(update["text"] || update["content"] || "");

    // Try item_list extraction
    if (!text) {
      const items = update["item_list"] as Array<Record<string, unknown>> | undefined;
      if (items?.length) {
        for (const item of items) {
          const type = Number(item["type"] || 0);
          if (type === 1) {
            const ti = item["text_item"] as Record<string, unknown> | undefined;
            if (ti?.text) {
              text = String(ti.text);
              break;
            }
          }
        }
      }
    }

    if (!from || !text) return null;

    return {
      providerUserId: from,
      content: text,
      messageId,
      contextToken,
      rawPayload: update,
    };
  }

  // ── getTypingTicket ──

  async getTypingTicket(): Promise<string | null> {
    if (this.typingTicketCache && Date.now() < this.typingTicketCache.expiresAt) {
      return this.typingTicketCache.ticket;
    }

    try {
      const resp = await fetch(`${this.baseUrl}/getconfig`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({}),
      });

      if (!resp.ok) {
        logger.warn(`getconfig failed: HTTP ${resp.status}`);
        return null;
      }

      const data = (await resp.json()) as Record<string, unknown>;
      const ticket = String(data["typing_ticket"] || data["typingTicket"] || "");

      if (ticket) {
        this.typingTicketCache = {
          ticket,
          expiresAt: Date.now() + 23 * 60 * 60 * 1000, // ~24h
        };
        return ticket;
      }
    } catch (err) {
      logger.warn("getTypingTicket failed", String(err));
    }

    return null;
  }

  // ── sendTyping ──

  async sendTyping(toUserId: string, contextToken: string, status: 1 | 2): Promise<boolean> {
    try {
      const typingTicket = await this.getTypingTicket();

      const body: Record<string, unknown> = {
        msg: {
          from_user_id: "",
          to_user_id: toUserId,
          client_id: `openclaw-weixin-${randomBytes(8).toString("hex")}`,
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

      if (typingTicket) {
        body["typing_ticket"] = typingTicket;
      }

      const resp = await fetch(`${this.baseUrl}/sendtyping`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify(body),
      });

      return resp.ok;
    } catch (err) {
      logger.warn("sendTyping failed", String(err));
      return false;
    }
  }

  // ── sendMessage ──

  async sendMessage(toUserId: string, text: string, contextToken: string): Promise<boolean> {
    try {
      const body: Record<string, unknown> = {
        msg: {
          from_user_id: "",
          to_user_id: toUserId,
          client_id: `openclaw-weixin-${randomBytes(8).toString("hex")}`,
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
        headers: this.headers(),
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        logger.warn(`sendMessage failed: HTTP ${resp.status}`);
        return false;
      }

      logger.info(`sendMessage success to ${toUserId.slice(0, 16)}...`);
      return true;
    } catch (err) {
      logger.error("sendMessage error", String(err));
      return false;
    }
  }
}
