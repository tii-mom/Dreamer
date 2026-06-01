import { getBindingByProviderUser, createWechatBinding } from "./xms-wechat.server";
import {
  getUser,
  createUser,
  devStore,
  nowIso,
  todayKey,
  getOrCreateDailyState,
} from "./xms-store.server";
import { generateMasterReply } from "./xms-ai.server";
import { getAssetUrl } from "@/lib/assets/asset-url";
import type { AssetVariant } from "@/lib/assets/asset-types";

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

export async function handleBotMessage(
  env: CloudflareBindings,
  providerUserId: string,
  content: string,
  rawPayload: unknown,
): Promise<string> {
  // 1. Get or create binding & user
  let binding = await getBindingByProviderUser(env, "clawbot", providerUserId);
  let user = binding ? await getUser(env, binding.userId) : null;

  if (!binding || !user) {
    // Create guest user
    const guestId = `usr_${crypto.randomUUID().slice(0, 8)}`;
    user = await createUser(env, guestId, `微信道友_${providerUserId.slice(-4)}`);
    binding = {
      id: `bin_${crypto.randomUUID().slice(0, 8)}`,
      userId: guestId,
      provider: "clawbot",
      providerUserId,
      status: "active",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await createWechatBinding(env, binding);
  }

  // 2. Persist incoming message
  const incomingId = `msg_in_${crypto.randomUUID().slice(0, 8)}`;
  const text = content.trim();

  // 3. Intent Detection
  let intent = "chat";
  if (/今日|运势|流日/.test(text)) intent = "daily";
  else if (/感情|姻缘|复合|对象/.test(text)) intent = "love";
  else if (/财|钱|副业|收入/.test(text)) intent = "money";
  else if (/工作|事业|老板|合作|跳槽/.test(text)) intent = "work";
  else if (/抽签|签/.test(text)) intent = "draw";
  else if (/盲盒|抽/.test(text)) intent = "blindbox";
  else if (/铭文|装备/.test(text)) intent = "inscription";
  else if (/命铺|经营|掌柜|899/.test(text)) intent = "operator";
  else if (/推广|朋友圈|文案|生成图/.test(text)) intent = "promo";
  else if (/我的|背包|账户|资产/.test(text)) intent = "my";
  else if (/帮助|help|菜单/.test(text)) intent = "help";

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

  // 4. Generate Reply based on intent
  let replyText = "";
  const daily = await getOrCreateDailyState(env, user);
  const baseUrl = env.APP_BASE_URL || "https://bige.life";
  const publicAssetUrl = (assetId: string, variant: AssetVariant) =>
    `${baseUrl}${getAssetUrl(assetId, variant)}`;

  switch (intent) {
    case "help":
      replyText =
        `🔮 戏命师微信指令秘籍：\n\n` +
        `【今日】查看今日运势与避坑建议\n` +
        `【感情】问姻缘与桃花局\n` +
        `【财运】问今日财气与起运\n` +
        `【工作】问事业与谈判窗口\n` +
        `【抽签】叩问灵签、解惑吉凶\n` +
        `【盲盒】开启命师盲盒入口\n` +
        `【铭文】查看装配的命盘铭文\n` +
        `【命铺】查看 ¥899 命铺经营者详情\n` +
        `【推广】经营者获取今日朋友圈推广素材\n` +
        `【我的】查看账户与当前命理资产\n\n` +
        `直接发送其他任何内容，戏命师会替你拆盘推演。`;
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

    case "my":
      replyText =
        `☯️ 你的命理账户：\n` +
        `代号：${user.nickname}\n` +
        `气运：${user.qiyun}\n` +
        `级别：${user.level}\n` +
        `命盘状态：${user.sealUnlocked}% 解封\n` +
        `经营者：${user.shopOpen ? "已激活" : "未开通"}\n\n` +
        `绑定恢复码：${user.recoveryCode}\n(请妥善保存，在网页端输入可同步此微信数据)`;
      break;

    case "blindbox":
      replyText =
        `🎴 命师盲盒池：\n` +
        `首版支持单抽(¥99)与十连抽(¥888)。\n` +
        `抽取稀有命师与强力铭文，增强微信戏命师属性！\n\n` +
        `【盲盒预览图】\n${publicAssetUrl("blind_box.box.standard", "box")}\n\n` +
        `👉 复制下方链接在浏览器中打开抽卡：\n` +
        `${baseUrl}/blindbox?uid=${user.id}`;
      break;

    case "inscription":
      replyText =
        `📜 铭文装配包：\n` +
        `你当前装配 the 铭文会直接改变微信戏命师的推演风格与能力加成。\n\n` +
        `【铭文预览图】\n${publicAssetUrl("rune.gold.01", "icon")}\n\n` +
        `👉 查看并管理你的铭文装配：\n` +
        `${baseUrl}/assets?uid=${user.id}`;
      break;

    case "operator":
      replyText =
        `🏮 成为戏命铺经营者：\n` +
        `只需 ¥899/月 开通专属经营者特权，建立你自己的朋友圈命铺。\n` +
        `- 拥有专属推广归因链接，引导朋友来测算。\n` +
        `- 自动统计转化，赚取平台活动香火值奖励。\n` +
        `- 铭文装配位直接 +2。\n\n` +
        `【命铺经营者分享图】\n${publicAssetUrl("share.earn", "mobile")}\n\n` +
        `👉 立即开通命铺经营者：\n` +
        `${baseUrl}/operator?uid=${user.id}`;
      break;

    case "promo": {
      const db = env.DB;
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

    default: {
      try {
        const aiRes = await generateMasterReply({
          env,
          user,
          birthProfile: null,
          daily,
          history: [],
          userText: text,
        });
        replyText = aiRes.text;
      } catch (err) {
        replyText = `推演断线，请稍后再叩。`;
      }
      break;
    }
  }

  // 5. Persist outgoing message
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
  let rawPayload = null;

  try {
    if (request.method === "POST") {
      const body = (await request.json()) as Record<string, unknown>;
      providerUserId = String(body.provider_user_id || body.from || "");
      content = String(body.content || body.text || "");
      rawPayload = body;
    } else {
      const url = new URL(request.url);
      providerUserId =
        url.searchParams.get("provider_user_id") || url.searchParams.get("from") || "";
      content = url.searchParams.get("content") || url.searchParams.get("text") || "";
      rawPayload = Object.fromEntries(url.searchParams);
    }
  } catch (err) {
    return new Response("Invalid request format", { status: 400 });
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
