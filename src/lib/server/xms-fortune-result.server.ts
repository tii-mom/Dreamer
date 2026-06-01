import type { SavedResultKind } from "../fortune/types";

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
