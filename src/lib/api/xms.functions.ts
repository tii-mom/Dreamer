import { createServerFn } from "@tanstack/react-start";
import { getCookie, getRequestUrl, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";

import type { BirthProfile } from "../domain";
import { SESSION_COOKIE, getRuntimeEnv, getUserBySession } from "../server/xms-store.server";
import {
  applyEarnAccess as applyEarnAccessService,
  checkInDaily as checkInDailyService,
  ensureSessionFromToken,
  generateShareCard as generateShareCardService,
  handleUserMessage,
  recordEvent,
  restoreSessionByCode,
  saveBirthProfile as saveBirthProfileService,
  sessionCookieOptions,
} from "../server/xms-service.server";

function writeSessionCookie(token: string) {
  const isHttps = getRequestUrl().startsWith("https://");
  setCookie(SESSION_COOKIE, token, {
    ...sessionCookieOptions(),
    secure: isHttps,
  });
}

function token() {
  return getCookie(SESSION_COOKIE);
}

export const ensureSession = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  return ensureSessionFromToken(context, token(), writeSessionCookie);
});

export const restoreSession = createServerFn({ method: "POST" })
  .inputValidator(z.object({ recoveryCode: z.string().min(6) }))
  .handler(async ({ context, data }) => {
    return restoreSessionByCode(context, data.recoveryCode, writeSessionCookie);
  });

export const sendMessage = createServerFn({ method: "POST" })
  .inputValidator(z.object({ threadId: z.string().min(1), text: z.string().min(1).max(1200) }))
  .handler(async ({ context, data }) => {
    return handleUserMessage(context, token(), data);
  });

export const saveBirthProfile = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      calendarType: z.enum(["solar", "lunar"]),
      birthDate: z.string().min(4),
      birthTime: z.string().optional(),
      gender: z.enum(["male", "female", "unknown"]).optional(),
      rawText: z.string().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    return saveBirthProfileService(context, token(), data satisfies BirthProfile);
  });

export const getDailyState = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const bootstrap = await ensureSessionFromToken(context, token(), writeSessionCookie);
  return { user: bootstrap.user, daily: bootstrap.daily };
});

export const checkInDaily = createServerFn({ method: "POST" }).handler(async ({ context }) => {
  return checkInDailyService(context, token());
});

export const generateShareCard = createServerFn({ method: "POST" })
  .inputValidator(z.object({ kind: z.enum(["seal", "daily", "earn"]) }))
  .handler(async ({ context, data }) => {
    return generateShareCardService(context, token(), data.kind);
  });

export const applyEarnAccess = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      offer: z.string().min(2).max(120),
      audience: z.string().min(2).max(120),
      priceRange: z.string().min(1).max(40),
    }),
  )
  .handler(async ({ context, data }) => {
    return applyEarnAccessService(context, token(), data);
  });

export const trackEvent = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ name: z.string().min(1).max(80), props: z.record(z.unknown()).default({}) }),
  )
  .handler(async ({ context, data }) => {
    return recordEvent(context, token(), data.name, data.props);
  });

export const getRuntimeHealth = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const env = getRuntimeEnv(context);
  const user = await getUserBySession(env, token());
  return {
    ok: true,
    userId: user?.id ?? null,
    hasD1: Boolean(env.DB),
    hasKv: Boolean(env.SESSION_KV),
    hasR2: Boolean(env.ASSETS_BUCKET),
    hasQueue: Boolean(env.AI_QUEUE),
    hasDeepSeek: Boolean(env.DEEPSEEK_API_KEY && env.CF_ACCOUNT_ID && env.CF_AI_GATEWAY_ID),
  };
});
