import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { getRuntimeEnv, getUserBySession } from "../server/xms-store.server";
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

    const ticket = await createBindTicket(env, {
      scene: data.scene || "bind",
      referralCode: data.referralCode,
      masterAssetId: data.masterAssetId,
    });

    return {
      ticket: ticket.ticket,
      bindCode: ticket.bindCode,
      expiresAt: ticket.expiresAt,
      qrUrl: `${baseUrl}/bind?ticket=${ticket.ticket}`,
      instruction: `请在微信中添加 ClawBot_XMS，发送：绑定 ${ticket.bindCode}`,
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
