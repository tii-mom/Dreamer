import { escapeHtml, wrapReportHtml } from "../fortune/report-html";
import { listSavedResults } from "./xms-fortune-result.server";
import { getUserBySession, SESSION_COOKIE } from "./xms-store.server";

function cookieValue(request: Request, name: string) {
  const cookie = request.headers.get("cookie") || "";
  return cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export async function serveFortuneHistory(request: Request, env: CloudflareBindings) {
  const token = cookieValue(request, SESSION_COOKIE);
  const user = await getUserBySession(env, token);

  if (!user) {
    const html = [
      '<article class="xms-report">',
      "<h1>Saved reports</h1>",
      "<section><h2>Login required</h2>",
      "<p>Please open this page from your bound session or report link.</p></section>",
      "</article>",
    ].join("");

    return new Response(wrapReportHtml({ title: "Saved reports", html }), {
      status: 401,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  const rows = await listSavedResults(env, user.id);
  const items = rows
    .map((item) =>
      [
        "<li>",
        `<a href="/r/${escapeHtml(item.id)}">${escapeHtml(item.title)}</a>`,
        `<p>${escapeHtml(item.kind)} · ${escapeHtml(item.createdAt)}</p>`,
        `<p>${escapeHtml(item.summary)}</p>`,
        "</li>",
      ].join(""),
    )
    .join("");
  const empty = "<li>No saved reports yet.</li>";
  const html = [
    '<article class="xms-report">',
    "<h1>Saved reports</h1>",
    `<section><h2>${escapeHtml(user.nickname)}</h2>`,
    `<ul>${items || empty}</ul></section>`,
    "</article>",
  ].join("");

  return new Response(wrapReportHtml({ title: "Saved reports", html }), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
