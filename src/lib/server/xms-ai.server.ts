import type { BirthProfile, ChatMsg, DailyState, UserProfile } from "../domain";

type GenerateReplyInput = {
  env: CloudflareBindings;
  user: UserProfile;
  birthProfile: BirthProfile | null;
  daily: DailyState;
  history: ChatMsg[];
  userText: string;
};

const SYSTEM_PROMPT = `
你是「戏命师」，一个住在用户手机里的毒舌命师。你不是 AI、不是机器人、不是程序。

公开运营边界：
- 可以用强刺激、稀缺、断签、排行榜、出马资格、赚钱欲望做钩子。
- 不承诺稳赚，不伪造真实收益，不给具体股票/币种/彩票建议。
- 不做医疗诊断，只能提醒关注健康和建议体检。
- 不鼓励违法、骚扰、暴力、色情、政治动员。

回复风格：
- 古风说书人 + 现代网络梗 + 偶尔毒舌 + 关键处正经。
- 每次 3-5 句话，移动端好读。
- 先给一个有用判断，再给一个具体行动，再埋一个转化钩子。
- 结合用户本命资料、今日流日和历史对话；没有资料就催用户报八字。
`;

function fallbackReply(input: GenerateReplyInput) {
  const text = input.userText;
  const hasBirth = Boolean(input.birthProfile);
  if (!hasBirth && /八字|生日|出生|[12][0-9]{3}/.test(text)) {
    return "行，我先把你的命盘点亮三成。现在只露命宫与财帛，剩下大运流年还封着。\n\n今日先记一句：你不是没机会，是开口太晚。把出生年月日时说全，我给你继续往深处推。";
  }
  if (/财|钱|赚钱|副业|收入|订单/.test(text)) {
    return `我观你今日「${input.daily.fortune.title}」，财星不懒，是你手慢。\n\n${input.daily.fortune.luckyHour} 适合报价、催款、发服务菜单，别装清高。\n\n想让戏命师替你接单，先申请出马资格，别等别人把香火收完了。`;
  }
  if (/感情|姻缘|喜欢|对象|男友|女友|复合/.test(text)) {
    return "红鸾有动，但你这嘴像带刺的桃花枝。\n\n今天别问对方爱不爱你，问一个具体邀约：吃饭、见面、把话说开。\n\n想看合盘深处，先把双方生日补齐，天机不吃空气。";
  }
  if (/事业|工作|老板|跳槽|合作/.test(text)) {
    return `今日宜主动出击，尤其 ${input.daily.fortune.luckyHour} 这段窗口。\n\n你适合把话说成交易：结果、时间、价格，别只讲情绪。\n\n我能给你拆一版事业盘，但免费命格今日问事次数有限。`;
  }
  return `嗯，这事我看见一半。${input.daily.fortune.body}\n\n你今天的吉向在${input.daily.fortune.direction}，先做一个能立刻带来反馈的小动作。\n\n要我说透，就把八字补全，再来问我。天机能泄，但不能白泄。`;
}

function compactHistory(messages: ChatMsg[]) {
  return messages
    .filter((message) => message.type === "text")
    .slice(-10)
    .map((message) => ({
      role: message.role === "user" ? "user" : "assistant",
      content: message.text,
    }));
}

export async function generateMasterReply(input: GenerateReplyInput) {
  const model = input.env.DEEPSEEK_CHAT_MODEL || "deepseek-v4-flash";
  const accountId = input.env.CF_ACCOUNT_ID;
  const gatewayId = input.env.CF_AI_GATEWAY_ID;
  const apiKey = input.env.DEEPSEEK_API_KEY;

  if (!accountId || !gatewayId || !apiKey) {
    return {
      text: fallbackReply(input),
      model,
      status: "fallback" as const,
      error: "DeepSeek gateway env is not configured",
    };
  }

  const profileLine = input.birthProfile
    ? `用户八字资料：${input.birthProfile.rawText || `${input.birthProfile.birthDate} ${input.birthProfile.birthTime ?? ""}`}`
    : "用户尚未完整提交出生资料。";
  const dailyLine = `今日流日：${input.daily.fortune.title}；吉时 ${input.daily.fortune.luckyHour}；财神方位 ${input.daily.fortune.direction}；忌 ${input.daily.fortune.avoid}。`;

  try {
    const response = await fetch(
      `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/deepseek/chat/completions`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
          "cf-aig-metadata": JSON.stringify({ userId: input.user.id, feature: "web-chat" }),
        },
        body: JSON.stringify({
          model,
          thinking: { type: "disabled" },
          max_tokens: 450,
          temperature: 0.85,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "system",
              content: `${profileLine}\n${dailyLine}\n用户等级：${input.user.level}；连续问安：${input.user.streak}日；命盘亮度：${input.user.chartGlow}。`,
            },
            ...compactHistory(input.history),
            { role: "user", content: input.userText },
          ],
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      return { text: fallbackReply(input), model, status: "fallback" as const, error };
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = payload.choices?.[0]?.message?.content?.trim();
    return { text: text || fallbackReply(input), model, status: "ok" as const };
  } catch (error) {
    return {
      text: fallbackReply(input),
      model,
      status: "fallback" as const,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
