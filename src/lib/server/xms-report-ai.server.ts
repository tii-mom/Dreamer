import { renderFallbackReport } from "../fortune/report-html";

export type HtmlReportInput = {
  env: CloudflareBindings;
  userId: string;
  title: string;
  topic: string;
  context: string;
};

export async function generateHtmlReport(input: HtmlReportInput) {
  const model = input.env.DEEPSEEK_CHAT_MODEL || "deepseek-v4-flash";
  const accountId = input.env.CF_ACCOUNT_ID;
  const gatewayId = input.env.CF_AI_GATEWAY_ID;
  const apiKey = input.env.DEEPSEEK_API_KEY;
  const fallback = renderFallbackReport({
    title: input.title,
    summary: input.topic,
    body: input.context,
  });

  if (!accountId || !gatewayId || !apiKey) {
    return {
      html: fallback,
      summary: input.topic,
      model,
      status: "fallback" as const,
    };
  }

  try {
    const response = await fetch(
      `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/deepseek/chat/completions`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
          "cf-aig-metadata": JSON.stringify({
            userId: input.userId,
            feature: "html-report",
          }),
        },
        body: JSON.stringify({
          model,
          thinking: { type: "disabled" },
          max_tokens: 1200,
          temperature: 0.72,
          messages: [
            {
              role: "system",
              content:
                "你是戏命师报告生成器。只输出安全的 HTML 片段，禁止 script，禁止外链脚本。结构必须包含 h1、核心结论、命理依据、行动建议、免责声明。内容仅作娱乐和自我反思参考。",
            },
            {
              role: "user",
              content: `标题：${input.title}\n主题：${input.topic}\n上下文：${input.context}`,
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      return {
        html: fallback,
        summary: input.topic,
        model,
        status: "fallback" as const,
      };
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const html = payload.choices?.[0]?.message?.content?.trim() || fallback;
    return { html, summary: input.topic, model, status: "ok" as const };
  } catch {
    return {
      html: fallback,
      summary: input.topic,
      model,
      status: "fallback" as const,
    };
  }
}
