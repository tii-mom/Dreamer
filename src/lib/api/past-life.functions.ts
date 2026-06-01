import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { SESSION_COOKIE, getRuntimeEnv, getUserBySession } from "../server/xms-store.server";
import { getOrCreateUserChart } from "../server/xms-chart.server";
import {
  getOrCreatePastLifeResult,
  getPastLifeResultByShareToken,
} from "../server/xms-past-life.server";

export const createPastLifeResult = createServerFn({ method: "POST" })
  .inputValidator(z.object({}))
  .handler(async ({ context }) => {
    const env = getRuntimeEnv(context);
    const baseUrl = env.APP_BASE_URL || "https://bige.life";

    const token = getCookie(SESSION_COOKIE) || undefined;
    const user = token ? await getUserBySession(env, token) : null;
    if (!user) return { ok: false, reason: "not_logged_in" };

    const { chart } = await getOrCreateUserChart(env, user.id, null);
    if (!chart) return { ok: false, reason: "missing_chart" };

    const result = await getOrCreatePastLifeResult(env, user.id, chart);

    const shareUrl = `${baseUrl}/past-life/share/${result.shareToken}`;

    return {
      ok: true,
      result: {
        id: result.id,
        title: result.title,
        rank: result.preset.rank,
        rarity: result.rarity,
        camp: result.camp,
        keywords: result.preset.keywords,
        shortText: result.preset.shortText,
        chartReasonShort: result.chartReasonShort,
        shareToken: result.shareToken,
        shareUrl,
        svgUrl: `${baseUrl}/api/share/past-life-card/${result.shareToken}.svg`,
      },
    };
  });

export const queryPastLifeResult = createServerFn({ method: "GET" })
  .inputValidator(z.object({ shareToken: z.string().min(1) }))
  .handler(async ({ context, data }) => {
    const env = getRuntimeEnv(context);
    const result = await getPastLifeResultByShareToken(env, data.shareToken);
    if (!result) return { ok: false, reason: "not_found" };

    return {
      ok: true,
      result: {
        title: result.title,
        rank: result.preset.rank,
        rarity: result.rarity,
        keywords: result.preset.keywords,
        shortText: result.preset.shortText,
        shareText: result.preset.shareText,
        camp: result.camp,
        chartReasonShort: result.chartReasonShort,
        shareToken: result.shareToken,
      },
    };
  });
