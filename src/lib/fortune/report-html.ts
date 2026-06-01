export function sanitizeReportHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderFallbackReport(input: { title: string; summary: string; body?: string }) {
  const body = input.body || input.summary;
  return `<article class="xms-report"><h1>${escapeHtml(input.title)}</h1><section><h2>核心结论</h2><p>${escapeHtml(input.summary)}</p></section><section><h2>详细内容</h2><p>${escapeHtml(body)}</p></section><footer><p>本内容仅供娱乐与自我反思参考，不构成医疗、法律或投资建议。</p></footer></article>`;
}

export function wrapReportHtml(input: { title: string; html: string; createdAt?: string }) {
  const safe = sanitizeReportHtml(input.html);
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(input.title)}</title><style>body{margin:0;background:#140d1d;color:#f8edd6;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.page{max-width:760px;margin:0 auto;padding:24px 16px 48px}.card{border:1px solid rgba(215,177,92,.28);border-radius:24px;background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.03));box-shadow:0 24px 80px rgba(0,0,0,.32);padding:22px}.meta{color:#c9a86a;font-size:12px;margin-bottom:14px}.xms-report h1{font-size:26px;line-height:1.2;margin:0 0 18px}.xms-report h2{font-size:17px;color:#ffd37a;margin-top:24px}.xms-report p,.xms-report li{font-size:15px;line-height:1.85;color:#f4e8cf}.xms-report section{border-top:1px solid rgba(215,177,92,.16);margin-top:18px;padding-top:10px}.actions{margin-top:20px;display:flex;gap:10px;flex-wrap:wrap}.actions a{color:#1a1024;background:#ffd37a;text-decoration:none;padding:10px 14px;border-radius:999px;font-size:13px;font-weight:700}.disclaimer{font-size:12px;color:#bba98c;margin-top:22px;line-height:1.7}</style></head><body><main class="page"><div class="card"><div class="meta">紫微戏命师 · 已保存卷宗${input.createdAt ? ` · ${escapeHtml(input.createdAt)}` : ""}</div>${safe}<div class="actions"><a href="/history">查看历史</a><a href="/try">回到聊天</a></div><p class="disclaimer">本内容仅供娱乐互动、民俗文化与自我反思参考，不构成医疗诊断、法律意见或投资建议。</p></div></main></body></html>`;
}
