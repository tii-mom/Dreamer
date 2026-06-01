import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { SESSION_COOKIE, getUserBySession, getRuntimeEnv } from "../server/xms-store.server";
import {
  getUserAssets,
  getUserBlindboxDraws,
  getEquippedInscriptions,
  equipInscription,
} from "../server/xms-blindbox.server";

function token() {
  return getCookie(SESSION_COOKIE);
}

export const fetchUserAssets = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const env = getRuntimeEnv(context);
  const user = await getUserBySession(env, token());
  if (!user) return { assets: [] };
  const assets = await getUserAssets(env, user.id);
  return { assets };
});

export const fetchBlindboxDraws = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const env = getRuntimeEnv(context);
  const user = await getUserBySession(env, token());
  if (!user) return { draws: [] };
  const draws = await getUserBlindboxDraws(env, user.id);
  return { draws };
});

export const fetchEquipped = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const env = getRuntimeEnv(context);
  const user = await getUserBySession(env, token());
  if (!user) return { equipped: [] };
  const equipped = await getEquippedInscriptions(env, user.id);
  return { equipped };
});

export const equipRune = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ assetId: z.string().min(1), slotIndex: z.number().int().nonnegative() }),
  )
  .handler(async ({ context, data }) => {
    const env = getRuntimeEnv(context);
    const user = await getUserBySession(env, token());
    if (!user) return { success: false };
    const success = await equipInscription(env, user.id, data.assetId, data.slotIndex);
    return { success };
  });
