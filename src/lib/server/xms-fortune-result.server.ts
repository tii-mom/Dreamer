import type { SavedResultKind } from "../fortune/types";
import { sanitizeReportHtml } from "../fortune/report-html";
import { nowIso, randomId } from "./xms-store.server";

export type FortuneResultView = {
  id: string;
  userId: string;
  kind: SavedResultKind;
  title: string;
  summary: string;
  html: string | null;
  dataJson: string;
  shareToken: string | null;
  createdAt: string;
};

export function mapFortuneResultRow(row: Record<string, unknown>): FortuneResultView {
  return {
    id: String(row.id),
    userId: String(row.user_id ?? row.userId),
    kind: String(row.kind) as SavedResultKind,
    title: String(row.title),
    summary: String(row.summary),
    html: row.html ? String(row.html) : null,
    dataJson: String(row.data_json ?? row.dataJson ?? "{}"),
    shareToken: row.share_token ? String(row.share_token) : row.shareToken ? String(row.shareToken) : null,
    createdAt: String(row.created_at ?? row.createdAt),
  };
}

function makeShareToken(id: string) {
  return `fr_${id.replace(/^fr_/, "").slice(0, 24)}`;
}

export async function createSavedResult(env: CloudflareBindings, input: {
  userId: string;
  kind: SavedResultKind;
  title: string;
  summary: string;
  html?: string | null;
  data?: unknown;
  model?: string | null;
}) {
  const id = randomId("fr");
  const now = nowIso();
  const html = input.html ? sanitizeReportHtml(input.html) : null;
  const dataJson = JSON.stringify(input.data ?? {});
  const shareToken = makeShareToken(id);
  if (env.DB) {
    await env.DB.prepare("INSERT INTO fortune_results (id,user_id,kind,title,summary,html,data_json,share_token,model,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
      .bind(id, input.userId, input.kind, input.title, input.summary, html, dataJson, shareToken, input.model ?? null, now, now)
      .run();
  }
  return { id, userId: input.userId, kind: input.kind, title: input.title, summary: input.summary, html, dataJson, shareToken, createdAt: now } satisfies FortuneResultView;
}

export async function listSavedResults(env: CloudflareBindings, userId: string) {
  if (!env.DB) return [];
  const rows = await env.DB.prepare("SELECT * FROM fortune_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 50")
    .bind(userId)
    .all<Record<string, unknown>>();
  return (rows.results ?? []).map(mapFortuneResultRow);
}

export async function readSavedResult(env: CloudflareBindings, id: string) {
  if (!env.DB) return null;
  const row = await env.DB.prepare("SELECT * FROM fortune_results WHERE id = ?")
    .bind(id)
    .first<Record<string, unknown>>();
  return row ? mapFortuneResultRow(row) : null;
}

export async function readSharedResult(env: CloudflareBindings, token: string) {
  if (!env.DB) return null;
  const row = await env.DB.prepare("SELECT * FROM fortune_results WHERE share_token = ?")
    .bind(token)
    .first<Record<string, unknown>>();
  return row ? mapFortuneResultRow(row) : null;
}
