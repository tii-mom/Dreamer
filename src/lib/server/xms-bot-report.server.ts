import type { UserProfile } from "../domain";
import type { SavedResultKind } from "../fortune/types";
import { createSavedResult } from "./xms-fortune-result.server";
import { generateHtmlReport } from "./xms-report-ai.server";
import { createBotTicket } from "./xms-ticket.server";

export async function createBotHtmlReportReply(input: {
  env: CloudflareBindings;
  user: UserProfile;
  providerUserId: string;
  kind: SavedResultKind;
  title: string;
  topic: string;
  context: string;
  scene: string;
}) {
  const report = await generateHtmlReport({
    env: input.env,
    userId: input.user.id,
    title: input.title,
    topic: input.topic,
    context: input.context,
  });

  const saved = await createSavedResult(input.env, {
    userId: input.user.id,
    kind: input.kind,
    title: input.title,
    summary: report.summary,
    html: report.html,
    data: { topic: input.topic, context: input.context },
    model: report.model,
  });

  const baseUrl = input.env.APP_BASE_URL || "https://bige.life";
  let url = `${baseUrl}/r/${saved.id}`;

  try {
    const ticket = await createBotTicket(input.env, {
      userId: input.user.id,
      provider: "clawbot",
      providerUserId: input.providerUserId,
      scene: input.scene,
    });
    url = `${url}?ticket=${ticket.ticket}`;
  } catch {
    // Report remains readable by direct id; ticket is a convenience for web session binding.
  }

  return [
    "我已把这份天机写成卷宗，微信里太长，看了伤眼。",
    "",
    `【${input.title}】`,
    report.summary,
    "",
    "打开 HTML 报告：",
    url,
    "",
    "此报告已保存。回「历史」可查看。",
  ].join("\n");
}
