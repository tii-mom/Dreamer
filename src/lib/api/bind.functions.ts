import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { SESSION_COOKIE, getRuntimeEnv, getUserBySession } from "../server/xms-store.server";
import { createBindTicket, queryBindTicketStatus } from "../server/xms-bind-ticket.server";

export const createClawbotBindTicket = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      scene: z.enum(["bind", "operator", "referral", "master", "blindbox"]).optional(),
      referralCode: z.string().optional(),
      masterAssetId: z.string().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const env = getRuntimeEnv(context);
    const baseUrl = env.APP_BASE_URL || "https://bige.life";

    const token = getCookie(SESSION_COOKIE) || undefined;
    const user = token ? await getUserBySession(env, token) : null;

    const ticket = await createBindTicket(env, {
      userId: user?.id ?? null,
      scene: data.scene || "bind",
      referralCode: data.referralCode,
      masterAssetId: data.masterAssetId,
    });

    return {
      ticket: ticket.ticket,
      bindCode: ticket.bindCode,
      expiresAt: ticket.expiresAt,
    };
  });

export const queryClawbotBindTicketStatus = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      ticket: z.string().min(1),
    }),
  )
  .handler(async ({ context, data }) => {
    const env = getRuntimeEnv(context);
    return queryBindTicketStatus(env, data.ticket);
  });
