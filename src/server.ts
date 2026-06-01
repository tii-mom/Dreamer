import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { logEvent } from "./lib/server/xms-store.server";
import {
  handleBufPayCallback,
  handleMockPaymentSuccess,
  handleAdminRequest,
} from "./lib/server/xms-payment.server";
import { clawbotWebhookHandler } from "./lib/server/xms-bot.server";

type ServerEntry = {
  fetch: (request: Request, opts?: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: CloudflareBindings = {}, ctx?: ExecutionContext) {
    try {
      const url = new URL(request.url);
      if (url.pathname === "/api/bot/clawbot/webhook") {
        return clawbotWebhookHandler(request, env);
      }

      if (url.pathname === "/api/pay/callback" && request.method === "POST") {
        return handleBufPayCallback(request, env);
      }

      if (url.pathname === "/api/pay/mock-success" && request.method === "POST") {
        return handleMockPaymentSuccess(request, env);
      }

      if (url.pathname.startsWith("/api/admin/")) {
        return handleAdminRequest(request, env);
      }

      if (url.pathname.startsWith("/api/assets/")) {
        return serveR2Asset(request, env);
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, {
        context: {
          cloudflare: { env, ctx },
        },
      });
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },

  async queue(batch: MessageBatch<AiQueueMessage>, env: CloudflareBindings) {
    for (const message of batch.messages) {
      await logEvent(
        env,
        null,
        "queue_message_seen",
        message.body as unknown as Record<string, unknown>,
      );
      message.ack();
    }
  },

  async scheduled(controller: ScheduledController, env: CloudflareBindings) {
    await logEvent(env, null, "cron_triggered", {
      cron: controller.cron,
      scheduledTime: controller.scheduledTime,
    });
  },
};

async function serveR2Asset(request: Request, env: CloudflareBindings) {
  if (!env.ASSETS_BUCKET) return new Response("R2 is not configured", { status: 404 });
  const url = new URL(request.url);
  const key = decodeURIComponent(url.pathname.replace("/api/assets/", ""));
  const object = await env.ASSETS_BUCKET.get(key);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
}
