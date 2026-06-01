import { createWechatBinding, getBindingByProviderUser, verifyBridgeSignature } from "./xms-wechat.server";
import { createUser, getBirthProfile, getUser, nowIso } from "./xms-store.server";
import { getOrCreateUserChart } from "./xms-chart.server";
import { createBotHtmlReportReply } from "./xms-bot-report.server";

export function wantsLongReport(text: string) {
  const lower = text.toLowerCase();
  const keys = ["report", "full", "detail", "html", "\u8be6\u7ec6", "\u5b8c\u6574", "\u62a5\u544a", "\u89e3\u5c01", "\u5377\u5b97"];
  return keys.some((key) => lower.includes(key));
}

export type ClawbotIngestBody = {
  provider?: string;
  providerUserId?: string;
  content?: string;
  rawPayload?: unknown;
};

export async function maybeClawbotReportIngestHandler(
  request: Request,
  env: CloudflareBindings,
): Promise<Response | null> {
  if (request.method !== "POST") return null;
  const bodyText = await request.clone().text();
  let body: ClawbotIngestBody;
  try {
    body = JSON.parse(bodyText) as ClawbotIngestBody;
  } catch {
    return null;
  }
  if (body.provider !== "clawbot" || !body.providerUserId || !body.content) return null;
  if (!wantsLongReport(body.content)) return null;
  if (!verifyBridgeSignature(request, env, bodyText)) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let binding = await getBindingByProviderUser(env, "clawbot", body.providerUserId);
  let user = binding ? await getUser(env, binding.userId) : null;
  if (!binding || !user) {
    user = await createUser(env, { nickname: `wx_${body.providerUserId.slice(-4)}`, source: "clawbot" });
    binding = {
      id: `bin_${crypto.randomUUID().slice(0, 8)}`,
      userId: user.id,
      provider: "clawbot",
      providerUserId: body.providerUserId,
      status: "active",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await createWechatBinding(env, binding);
  }

  const birth = await getBirthProfile(env, user.id);
  const chart = birth ? await getOrCreateUserChart(env, user.id, birth) : null;
  const context = chart?.promptSummary || "No complete chart yet. Ask the user for full birth date and time.";
  const reply = await createBotHtmlReportReply({
    env,
    user,
    providerUserId: body.providerUserId,
    kind: "seal_report",
    title: "Fortune Report",
    topic: body.content,
    context,
    scene: "fortune-report",
  });
  return new Response(JSON.stringify({ ok: true, reply }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
