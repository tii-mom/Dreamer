import {
  getBindingByProviderUser,
  createWechatBinding,
  verifyClawbotSignature,
  verifyBridgeSignature,
} from "./xms-wechat.server";
import {
  getUser,
  createUser,
  getBirthProfile,
  saveBirthProfileRecord,
  updateUser,
  devStore,
  nowIso,
  todayKey,
  getOrCreateDailyState,
} from "./xms-store.server";
import { generateMasterReply } from "./xms-ai.server";
import { getAssetUrl } from "@/lib/assets/asset-url";
import type { AssetVariant } from "@/lib/assets/asset-types";
import { parseIntent, isMenuRequest, setMenuSession } from "@/lib/bot/command-parser";
import { renderMenu } from "@/lib/bot/render-menu";
import type { BotIntent } from "@/lib/bot/actions";
import { createBotTicket } from "./xms-ticket.server";
import {
  isBirthText,
  parseBirthProfileFromText,
  saveOrUpdateUserChart,
  getOrCreateUserChart,
} from "./xms-chart.server";
import { bindClawbotUserByCode } from "./xms-bind-ticket.server";
import { getMasterAgentMemories, getOrCreateActiveMasterAgent } from "./xms-master-agent.server";
import { getOrCreatePastLifeResult, buildPastLifeShareText } from "./xms-past-life.server";
import {
  getOrCreateUserChart,
  isBirthText,
  parseBirthProfileFromText,
  saveBirthProfileRecord,
  saveOrUpdateUserChart,
} from "./xms-chart.server";

export type BotMessage = {
  id: string;
  userId: string;
  bindingId?: string | null;
  channel: string;
  direction: "in" | "out";
  messageType: string;
  content: string;
  intent?: string | null;
  rawJson?: string | null;
  createdAt: string;
};

export async function logBotMessage(
  env: CloudflareBindings,
  msg: Omit<BotMessage, "createdAt">,
): Promise<void> {
  const db = env.DB;
  const now = nowIso();

  if (!db) {
    devStore().botMessages.set(msg.id, {
      ...msg,
      createdAt: now,
    });
    return;
  }

  await db
    .prepare(
      `INSERT INTO bot_messages 
      (id, user_id, binding_id, channel, direction, message_type, content, intent, raw_json, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      msg.id,
      msg.userId,
      msg.bindingId || null,
      msg.channel,
      msg.direction,
      msg.messageType,
      msg.content,
      msg.intent || null,
      msg.rawJson || null,
      now,
    )
    .run();
}

async function buildTicketUrl(
  env: CloudflareBindings,
  user: { id: string },
  providerUserId: string,
  scene: string,
  path: string,
): Promise<string> {
  const baseUrl = env.APP_BASE_URL || "https://bige.life";
  try {
    const ticket = await createBotTicket(env, {
      userId: user.id,
      provider: "clawbot",
      providerUserId,
      scene,
    });
    return `${baseUrl}${path}?ticket=${ticket.ticket}`;
  } catch {
    return `${baseUrl}${path}`;
  }
}

export async function handleBotMessage(
  env: CloudflareBindings,
  providerUserId: string,
  content: string,
  rawPayload: unknown,
): Promise<string> {
  const text = content.trim();

  // 1. Check for bind code command BEFORE creating any binding
  const bindMatch = text.match(/(?:绑定|bind|起运)\s*([A-Z0-9]{6,12})/i);
  if (bindMatch) {
    const bindCode = bindMatch[1].toUpperCase();
    const bindResult = await bindClawbotUserByCode(env, {
      bindCode,
      providerUserId,
    });

    // Look up the user (may have been created during bind, or pre-existing)
    const binding = await getBindingByProviderUser(env, "clawbot", providerUserId);
    const user = binding ? await getUser(env, binding.userId) : null;

    if (!bindResult.ok && !user) {
      // No real user and bind failed — return error without writing bot messages
      return bindResult.reason || "绑定码无效或已过期，请回到网页重新生成。";
    }

    const userId = user?.id || bindResult.userId || "unknown";
    const bindingId = binding?.id || bindResult.bindingId || "unknown";

    const incomingId = `msg_in_${crypto.randomUUID().slice(0, 8)}`;
    const outgoingId = `msg_out_${crypto.randomUUID().slice(0, 8)}`;
    let reply = "";
    if (bindResult.ok) {
      reply =
        `绑定成功。戏命师已入驻你的微信。\n` +
        `现在可以发送：\n` +
        `1 八字起盘\n` +
        `2 今日问事\n` +
        `3 解封命盘\n` +
        `4 开盲盒`;
    } else {
      reply = bindResult.reason || "绑定码无效或已过期，请回到网页重新生成。";
    }

    await logBotMessage(env, {
      id: incomingId,
      userId,
      bindingId,
      channel: "clawbot",
      direction: "in",
      messageType: "text",
      content: text,
      intent: "bind",
      rawJson: JSON.stringify(rawPayload),
    });
    await logBotMessage(env, {
      id: outgoingId,
      userId,
      bindingId,
      channel: "clawbot",
      direction: "out",
      messageType: "text",
      content: reply,
      intent: "bind",
      rawJson: JSON.stringify({ bindResult }),
    });
    return reply;
  }

  // 1.5 Check for past-life command
  if (/^(前世|前世身份|生成分享卡)$/.test(text)) {
    const bp = await getBirthProfile(env, binding ? binding.userId : user?.id);
    const chartCtx = bp
      ? await getOrCreateUserChart(env, (bp.userId as unknown as string) || user?.id, bp)
      : null;

    let reply = "";
    if (!chartCtx?.chart) {
      reply =
        `想看前世身份，不能只给年月日。\n` +
        `把出生年月日时补全，例如：\n` +
        `1995-06-15 22:00 女\n\n` +
        `缺时辰，我只能看见你前世的影子，看不见你当时到底是掌柜还是背锅侠。`;
    } else {
      const result = await getOrCreatePastLifeResult(
        env,
        binding ? binding.userId : user?.id || "unknown",
        chartCtx.chart,
      );

      const baseUrl = env.APP_BASE_URL || "https://bige.life";
      const shareUrl = `${baseUrl}/past-life/share/${result.shareToken}`;

      // Check if user is an operator for referral link
      let useReferral = false;
      let referralCode = "";
      const db = env.DB;
      if (db) {
        const op = await db
          .prepare(
            "SELECT referral_code FROM operators WHERE user_id = ? AND status = 'active' LIMIT 1",
          )
          .bind(binding ? binding.userId : user?.id)
          .first<{ referral_code: string }>();
        if (op) {
          useReferral = true;
          referralCode = op.referral_code;
        }
      } else {
        for (const op of devStore().operators.values()) {
          if (op.userId === (binding ? binding.userId : user?.id)) {
            useReferral = true;
            referralCode = op.referralCode;
            break;
          }
        }
      }

      const finalUrl = useReferral
        ? `${baseUrl}/s/${referralCode}?scene=past-life&share=${result.shareToken}`
        : shareUrl;

      reply = buildPastLifeShareText(result, finalUrl);
    }

    const outgoingId = `msg_out_${crypto.randomUUID().slice(0, 8)}`;
    await logBotMessage(env, {
      id: outgoingId,
      userId: binding ? binding.userId : user?.id || "unknown",
      bindingId: binding?.id || "unknown",
      channel: "clawbot",
      direction: "out",
      messageType: "text",
      content: reply,
      intent: "chat",
      rawJson: JSON.stringify({}),
    });
    return reply;
  }
  let binding = await getBindingByProviderUser(env, "clawbot", providerUserId);
  let user = binding ? await getUser(env, binding.userId) : null;

  if (!binding || !user) {
    user = await createUser(env, {
      nickname: `微信道友_${providerUserId.slice(-4)}`,
      source: "clawbot",
    });
    binding = {
      id: `bin_${crypto.randomUUID().slice(0, 8)}`,
      userId: user.id,
      provider: "clawbot",
      providerUserId,
      status: "active",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await createWechatBinding(env, binding);
  }

  // 3. Persist incoming message
  const incomingId = `msg_in_${crypto.randomUUID().slice(0, 8)}`;

  // 4. Check if operator
  const db = env.DB;
  let isOperator = false;
  if (db) {
    const op = await db
      .prepare("SELECT id FROM operators WHERE user_id = ? AND status = 'active' LIMIT 1")
      .bind(user.id)
      .first<{ id: string }>();
    isOperator = !!op;
  } else {
    isOperator = devStore().operators.has(user.id);
  }

  // 4. Check for menu request
  if (isMenuRequest(text)) {
    setMenuSession(user.id);
    const replyText = renderMenu(isOperator);
    await logBotMessage(env, {
      id: incomingId,
      userId: user.id,
      bindingId: binding.id,
      channel: "clawbot",
      direction: "in",
      messageType: "text",
      content: text,
      intent: "help",
      rawJson: JSON.stringify(rawPayload),
    });
    const outgoingId = `msg_out_${crypto.randomUUID().slice(0, 8)}`;
    await logBotMessage(env, {
      id: outgoingId,
      userId: user.id,
      bindingId: binding.id,
      channel: "clawbot",
      direction: "out",
      messageType: "text",
      content: replyText,
      intent: "help",
      rawJson: JSON.stringify({ sent: true }),
    });
    return replyText;
  }

  // 5. Parse intent using new command system
  const intent = parseIntent(text, user.id, isOperator) ?? "chat";

  await logBotMessage(env, {
    id: incomingId,
    userId: user.id,
    bindingId: binding.id,
    channel: "clawbot",
    direction: "in",
    messageType: "text",
    content: text,
    intent,
    rawJson: JSON.stringify(rawPayload),
  });

  // 6. Generate Reply based on intent
  let replyText = "";
  const daily = await getOrCreateDailyState(env, user);
  const baseUrl = env.APP_BASE_URL || "https://bige.life";
  const publicAssetUrl = (assetId: string, variant: AssetVariant) =>
    `${baseUrl}${getAssetUrl(assetId, variant)}`;

  switch (intent) {
    case "help":
      setMenuSession(user.id);
      replyText = renderMenu(isOperator);
      break;

    case "daily":
      replyText =
        `【今日流日 · 运势】\n` +
        `运势：${daily.fortune.title}\n` +
        `吉时：${daily.fortune.luckyHour}\n` +
        `财神位：${daily.fortune.direction}\n` +
        `避忌：${daily.fortune.avoid}\n\n` +
        `戏命判词：${daily.fortune.body}\n\n` +
        `回「抽签」求取今日灵签保护；回「盲盒」抽取财运铭文加成。`;
      break;

    case "my": {
      // Determine actual chart status
      const bp = await getBirthProfile(env, user.id);
      const chartContext = bp ? await getOrCreateUserChart(env, user.id, bp) : null;
      const chartStatus = chartContext?.chart
        ? "已起盘"
        : bp?.birthTime
          ? "排盘失败（请重新输入完整出生信息）"
          : bp
            ? "未补全出生时辰"
            : "未提交出生资料";
      replyText =
        `☯️ 你的命理账户：\n` +
        `代号：${user.nickname}\n` +
        `气运：${user.qiyun}\n` +
        `级别：${user.level}\n` +
        `命盘状态：${user.sealUnlocked}% 解封\n` +
        `经营者：${user.shopOpen ? "已激活" : "未开通"}\n` +
        `命盘：${chartStatus}\n\n` +
        `绑定恢复码：${user.recoveryCode}\n(请妥善保存，在网页端输入可同步此微信数据)`;
      break;
    }

    case "blindbox": {
      const ticketUrl = await buildTicketUrl(env, user, providerUserId, "blindbox", "/wx/blindbox");
      replyText =
        `🎴 命师盲盒池：\n` +
        `首版支持单抽(¥99)与十连抽(¥888)。\n` +
        `抽取稀有命师与强力铭文，增强微信戏命师属性！\n\n` +
        `【盲盒预览图】\n${publicAssetUrl("blind_box.box.standard", "box")}\n\n` +
        `👉 打开链接进入抽卡：\n${ticketUrl}`;
      break;
    }

    case "inscription": {
      const ticketUrl = await buildTicketUrl(env, user, providerUserId, "assets", "/wx/assets");
      replyText =
        `📜 铭文装配包：\n` +
        `你当前装配的铭文会直接改变微信戏命师的推演风格与能力加成。\n\n` +
        `【铭文预览图】\n${publicAssetUrl("rune.gold.01", "icon")}\n\n` +
        `👉 查看并管理你的铭文装配：\n${ticketUrl}`;
      break;
    }

    case "operator": {
      const ticketUrl = await buildTicketUrl(env, user, providerUserId, "operator", "/wx/operator");
      replyText =
        `🏮 成为戏命铺经营者：\n` +
        `只需 ¥899/月 开通专属经营者特权，建立你自己的朋友圈命铺。\n` +
        `- 拥有专属推广归因链接，引导朋友来测算。\n` +
        `- 自动统计转化，赚取平台活动香火值奖励。\n` +
        `- 铭文装配位直接 +2。\n\n` +
        `【命铺经营者分享图】\n${publicAssetUrl("share.earn", "mobile")}\n\n` +
        `👉 立即开通命铺经营者：\n${ticketUrl}`;
      break;
    }

    case "promo": {
      let op = null;
      if (db) {
        op = await db
          .prepare("SELECT * FROM operators WHERE user_id = ? AND status = 'active' LIMIT 1")
          .bind(user.id)
          .first<Record<string, unknown>>();
      } else {
        op = devStore().operators.get(user.id);
      }

      if (!op) {
        replyText = `掌柜，此功能仅限已激活的 ¥899 经营者使用。回「命铺」了解如何开通。`;
      } else {
        replyText =
          `掌柜，今日适合发「感情局」：\n\n` +
          `【朋友圈文案】\n` +
          `有些人不是不爱你，是你们俩命盘互相克嘴。\n` +
          `想知道你们是正缘还是孽缘？扫码发我生日，戏命师在线帮你拆。\n\n` +
          `【你的专属测算链接】\n` +
          `${baseUrl}/s/${String(op.referral_code)}\n\n` +
          `【今日朋友圈配图】\n${publicAssetUrl("share.daily", "mobile")}`;
      }
      break;
    }

    case "earnings": {
      replyText =
        `📊 经营收益概览：\n` +
        `请访问命铺面板查看详细数据。\n\n` +
        `👉 ${baseUrl}/operator/dashboard`;
      break;
    }

    case "draw":
      replyText =
        `🎋 灵签抽测：\n` +
        `请回复你想问的事情，戏命师将为你抽取灵签（功能即将上线）。\n\n` +
        `暂时请直接描述你的问题，戏命师会直接替你拆盘。`;
      break;

    default: {
      try {
        // Handle birth info if present
        let bp = await getBirthProfile(env, user.id);

        if (isBirthText(text)) {
          const parsed = parseBirthProfileFromText(text);
          if (parsed) {
            bp = await saveBirthProfileRecord(env, user.id, parsed);
            try {
              await saveOrUpdateUserChart(env, user.id, parsed);
            } catch {
              // Missing birth time is OK
            }
            user = await updateUser(env, {
              ...user,
              sealUnlocked: Math.max(user.sealUnlocked, 30),
              chartGlow: Math.max(user.chartGlow, 38),
            });
          }
        }

        const chartContext = await getOrCreateUserChart(env, user.id, bp);
        const masterAgent = await getOrCreateActiveMasterAgent(env, user.id);
        const agentMemories = await getMasterAgentMemories(env, masterAgent.id, user.id);

        const aiRes = await generateMasterReply({
          env,
          user,
          birthProfile: bp,
          chartPromptSummary: chartContext.promptSummary,
          daily,
          history: [],
          userText: text,
          masterAgent,
          agentMemories,
        });
        replyText = aiRes.text;
      } catch (err) {
        replyText = `推演断线，请稍后再叩。`;
      }
      break;
    }
  }

  // 7. Persist outgoing message
  const outgoingId = `msg_out_${crypto.randomUUID().slice(0, 8)}`;
  await logBotMessage(env, {
    id: outgoingId,
    userId: user.id,
    bindingId: binding.id,
    channel: "clawbot",
    direction: "out",
    messageType: "text",
    content: replyText,
    intent,
    rawJson: JSON.stringify({ sent: true }),
  });

  return replyText;
}

export async function clawbotWebhookHandler(
  request: Request,
  env: CloudflareBindings,
): Promise<Response> {
  let providerUserId = "";
  let content = "";
  let rawPayload: Record<string, unknown> | null = null;
  let bodyText = "";

  // Signature validation
  try {
    if (request.method === "POST") {
      const cloned = request.clone();
      bodyText = await cloned.text();
      rawPayload = JSON.parse(bodyText);
      providerUserId = String(rawPayload?.provider_user_id || rawPayload?.from || "");
      content = String(rawPayload?.content || rawPayload?.text || "");
    } else {
      const url = new URL(request.url);
      providerUserId =
        url.searchParams.get("provider_user_id") || url.searchParams.get("from") || "";
      content = url.searchParams.get("content") || url.searchParams.get("text") || "";
      rawPayload = Object.fromEntries(url.searchParams);
      bodyText = url.searchParams.toString();
    }

    if (!verifyClawbotSignature(request, env, bodyText)) {
      console.error("[Webhook Handler] ClawBot signature verification failed.");
      return new Response("Unauthorized signature", { status: 401 });
    }
  } catch (err) {
    return new Response("Invalid request format or payload", { status: 400 });
  }

  if (!providerUserId || !content) {
    return new Response("Missing provider_user_id or content", { status: 400 });
  }

  const reply = await handleBotMessage(env, providerUserId, content, rawPayload);
  return new Response(JSON.stringify({ reply }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function clawbotIngestHandler(
  request: Request,
  env: CloudflareBindings,
): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let bodyText = "";
  let body: { provider?: string; providerUserId?: string; content?: string; rawPayload?: unknown };
  try {
    bodyText = await request.clone().text();
    body = JSON.parse(bodyText);
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!verifyBridgeSignature(request, env, bodyText)) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const provider = body.provider;
  const providerUserId = body.providerUserId;
  const content = body.content;

  if (provider !== "clawbot") {
    return new Response(JSON.stringify({ ok: false, error: "Invalid provider" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!providerUserId || !content) {
    return new Response(JSON.stringify({ ok: false, error: "Missing providerUserId or content" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const reply = await handleBotMessage(env, providerUserId, content, body.rawPayload ?? {});
    return new Response(JSON.stringify({ ok: true, reply }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[Ingest] Error:", err);
    return new Response(JSON.stringify({ ok: false, error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
