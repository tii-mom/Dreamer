import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { escapeHtml, renderFallbackReport, wrapReportHtml } from "./lib/fortune/report-html";
import { maybeClawbotReportIngestHandler } from "./lib/server/xms-bot-report-ingest.server";
import { clawbotIngestHandler, clawbotWebhookHandler } from "./lib/server/xms-bot.server";
import { serveFortuneHistory } from "./lib/server/xms-fortune-history.server";
import { readSavedResult, readSharedResult } from "./lib/server/xms-fortune-result.server";
import {
  buildPastLifeShareSvg,
  getPastLifeResultByShareToken,
} from "./lib/server/xms-past-life.server";
import {
  handleAdminRequest,
  handleBufPayCallback,
  handleMockPaymentSuccess,
} from "./lib/server/xms-payment.server";
import { logEvent } from "./lib/server/xms-store.server";

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

      if (url.pathname === "/api/bot/clawbot/ingest" && request.method === "POST") {
        const reportResponse = await maybeClawbotReportIngestHandler(request, env);
        if (reportResponse) return reportResponse;
        return clawbotIngestHandler(request, env);
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

      if (url.pathname.startsWith("/api/share/past-life-card/") && url.pathname.endsWith(".svg")) {
        return servePastLifeSvg(request, env);
      }

      if (url.pathname === "/history") {
        return serveFortuneHistory(request, env);
      }

      if (url.pathname.startsWith("/r/")) {
        return serveFortuneReport(request, env);
      }

      if (url.pathname.startsWith("/share/result/")) {
        return serveSharedFortuneReport(request, env);
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

async function servePastLifeSvg(request: Request, env: CloudflareBindings) {
  const url = new URL(request.url);
  const token = url.pathname.replace("/api/share/past-life-card/", "").replace(".svg", "");

  if (!token) return new Response("Not found", { status: 404 });

  const result = await getPastLifeResultByShareToken(env, token);
  if (!result) return new Response("Not found", { status: 404 });

  const baseUrl = env.APP_BASE_URL || "https://bige.life";
  const shareUrl = `${baseUrl}/past-life/share/${result.shareToken}`;

  const svg = buildPastLifeShareSvg(result, { shareUrl, baseUrl });

  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

async function serveFortuneReport(request: Request, env: CloudflareBindings) {
  const url = new URL(request.url);
  const id = decodeURIComponent(url.pathname.replace("/r/", ""));
  if (!id) return new Response("Not found", { status: 404 });
  const result = await readSavedResult(env, id);
  if (!result) return new Response("Not found", { status: 404 });
  const html =
    result.html || renderFallbackReport({ title: result.title, summary: result.summary });
  return new Response(wrapReportHtml({ title: result.title, html, createdAt: result.createdAt }), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

async function serveSharedFortuneReport(request: Request, env: CloudflareBindings) {
  const url = new URL(request.url);
  const token = decodeURIComponent(url.pathname.replace("/share/result/", ""));
  if (!token) return new Response("Not found", { status: 404 });
  const result = await readSharedResult(env, token);
  if (!result) return new Response("Not found", { status: 404 });
  const html = [
    '<article class="xms-report">',
    `<h1>${escapeHtml(result.title)}</h1>`,
    "<section><h2>Summary</h2>",
    `<p>${escapeHtml(result.summary)}</p></section>`,
    "</article>",
  ].join("");
  return new Response(wrapReportHtml({ title: result.title, html, createdAt: result.createdAt }), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
