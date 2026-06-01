import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ensureSession, verifyTicket } from "@/lib/api/xms.functions";
import type { AppBootstrap } from "@/lib/domain";
import { createPastLifeResult } from "@/lib/api/past-life.functions";

export const Route = createFileRoute("/wx/past-life")({
  component: WxPastLife,
});

function WxPastLife() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const url = new URL(window.location.href);
    const ticket = url.searchParams.get("ticket");
    if (!ticket) {
      setLoading(false);
      setError("缺少访问凭证");
      return;
    }
    verifyTicket({ data: { ticket } })
      .then(() => setAuthenticated(true))
      .catch(() => setError("凭证无效或已过期"))
      .finally(() => setLoading(false));
  }, []);

  const generate = async () => {
    setLoading(true);
    try {
      const r = await createPastLifeResult({ data: {} });
      if (!r.ok) {
        setError(
          r.reason === "missing_chart" ? "请先在微信中发送出生年月日时给戏命师" : "生成失败",
        );
      } else {
        setResult(r.result as Record<string, unknown>);
      }
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  };

  const campLabels: Record<string, string> = {
    power: "权谋系",
    wealth: "财帛系",
    love: "桃花系",
    jianghu: "江湖系",
    immortal: "仙门系",
    underworld: "地府系",
  };
  const rarityLabels: Record<string, string> = {
    normal: "普通",
    rare: "稀有",
    epic: "史诗",
    legendary: "传说",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background text-bone flex flex-col items-center justify-center p-4 gap-4">
        <p className="text-sm text-red-400">{error || "请通过微信戏命师打开此链接"}</p>
        <Link to="/" className="text-gold text-sm">
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-bone flex flex-col items-center p-4 pt-8">
      <div className="max-w-md w-full space-y-5 text-center">
        <h1 className="font-display text-xl text-gold">前世反差身份卡</h1>

        {!result && (
          <div className="glass p-6 rounded-3xl border border-gold/15 space-y-4">
            <p className="text-sm text-muted-foreground">
              戏命师已通过微信识别你的身份。点击生成你的前世身份卡。
            </p>
            <button
              onClick={generate}
              className="w-full h-12 rounded-xl ritual-btn text-sm font-semibold"
            >
              生成前世身份
            </button>
          </div>
        )}

        {error && (
          <div className="glass p-6 rounded-3xl border border-red-500/20 space-y-4">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={generate}
              className="h-10 px-6 rounded-xl bg-gold/10 border border-gold/30 text-gold text-xs"
            >
              重试
            </button>
          </div>
        )}

        {result && (
          <div className="glass p-6 rounded-3xl border border-gold/15 space-y-4">
            <div className="text-5xl">📜</div>
            <h2 className="font-display text-xl text-gold">{result.title as string}</h2>
            <p className="text-sm text-muted-foreground">{result.rank as string}</p>
            <p className="text-xs text-gold">
              {rarityLabels[result.rarity as string] || (result.rarity as string)}｜命格池稀有
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {(result.keywords as string[]).map((k: string) => (
                <span key={k} className="px-3 py-1 rounded-full bg-gold/10 text-xs text-gold">
                  {k}
                </span>
              ))}
            </div>
            <p className="text-sm italic text-bone/80 leading-relaxed">
              「{result.shortText as string}」
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(result.shareUrl as string);
                alert("分享链接已复制！");
              }}
              className="w-full h-12 rounded-xl ritual-btn text-sm font-semibold"
            >
              复制分享链接
            </button>
            <p className="text-[10px] text-muted-foreground">娱乐互动内容，不构成现实判断。</p>
          </div>
        )}

        <Link to="/wx/home" className="text-xs text-gold/50">
          ← 返回微信首页
        </Link>
      </div>
    </div>
  );
}
