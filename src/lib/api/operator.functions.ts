import { createServerFn } from "@tanstack/react-start";
import {
  getCookie,
  setCookie,
  getRequestHeaders,
  getRequestIP,
} from "@tanstack/react-start/server";
import { z } from "zod";
import { SESSION_COOKIE, getUserBySession, getRuntimeEnv } from "../server/xms-store.server";
import {
  getOperatorByUserId,
  getReferralsCount,
  recordReferralVisit,
} from "../server/xms-operator.server";

function token() {
  return getCookie(SESSION_COOKIE);
}

export const getOperatorStatus = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const env = getRuntimeEnv(context);
  const user = await getUserBySession(env, token());
  if (!user) return { active: false, details: null, stats: null };

  const details = await getOperatorByUserId(env, user.id);
  if (!details || details.status !== "active") {
    return { active: false, details: null, stats: null };
  }

  const stats = await getReferralsCount(env, user.id);
  return {
    active: true,
    details,
    stats,
  };
});

export const bindReferralSession = createServerFn({ method: "POST" })
  .inputValidator(z.object({ referralCode: z.string().min(1) }))
  .handler(async ({ context, data }) => {
    const env = getRuntimeEnv(context);
    const user = await getUserBySession(env, token());

    // Track referral visit IP/UA using getRequestIP() and getRequestHeaders()
    const ip = getRequestIP({ xForwardedFor: true }) || null;
    const headers = getRequestHeaders();
    const ua = headers["user-agent"] || null;

    await recordReferralVisit(env, data.referralCode, user?.id || null, ip, ua);

    // Save referral code in cookie for conversions attribution
    setCookie("referral_code", data.referralCode, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return { ok: true };
  });
