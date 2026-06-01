import { createHmac, randomBytes } from "node:crypto";
import { logger } from "./logger.js";

export interface DreamerIngestInput {
  providerUserId: string;
  content: string;
  messageId?: string;
  contextToken?: string;
  rawPayload?: unknown;
}

export interface DreamerIngestOutput {
  ok: boolean;
  reply?: string;
  error?: string;
}

function generateSignature(
  secret: string,
  rawBody: string,
): {
  timestamp: string;
  nonce: string;
  signature: string;
} {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(16).toString("hex");
  const payload = `${timestamp}.${nonce}.${rawBody}`;
  const signature = createHmac("sha256", secret).update(payload, "utf-8").digest("hex");
  return { timestamp, nonce, signature };
}

export class DreamerClient {
  constructor(
    private baseUrl: string,
    private bridgeSecret: string,
  ) {}

  async sendToDreamer(input: DreamerIngestInput): Promise<DreamerIngestOutput> {
    const body = JSON.stringify({
      provider: "clawbot",
      providerUserId: input.providerUserId,
      content: input.content,
      messageId: input.messageId,
      contextToken: input.contextToken,
      rawPayload: input.rawPayload ?? {},
    });

    const { timestamp, nonce, signature } = generateSignature(this.bridgeSecret, body);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const resp = await fetch(`${this.baseUrl}/api/bot/clawbot/ingest`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-dreamer-bridge-timestamp": timestamp,
          "x-dreamer-bridge-nonce": nonce,
          "x-dreamer-bridge-signature": signature,
        },
        body,
        signal: controller.signal,
      });

      if (resp.status === 401) {
        logger.error("Dreamer ingest: signature rejected (401)");
        return { ok: false, error: "signature rejected" };
      }

      if (resp.status >= 500) {
        logger.warn(`Dreamer ingest: server error ${resp.status}`);
        return { ok: false, error: `server error ${resp.status}` };
      }

      const data = (await resp.json()) as { ok: boolean; reply?: string; error?: string };

      if (data.ok && data.reply) {
        logger.info("Dreamer ingest: reply received", { length: data.reply.length });
        return { ok: true, reply: data.reply };
      }

      logger.warn("Dreamer ingest: unexpected response", data);
      return { ok: false, error: data.error || "unexpected response" };
    } catch (err) {
      logger.error("Dreamer ingest: network error", String(err));
      return { ok: false, error: "network error" };
    } finally {
      clearTimeout(timeout);
    }
  }
}
