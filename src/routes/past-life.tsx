import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { ensureSession } from "@/lib/api/xms.functions";
import { createPastLifeResult } from "@/lib/api/past-life.functions";
import type { AppBootstrap } from "@/lib/domain";

export const Route = createFileRoute("/past-life")({
  component: PastLifePage,
});

function PastLifePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  const bootstrapQuery = useQuery({
    queryKey: ["xms-bootstrap"],
    queryFn: () => ensureSession(),
  });
  const bootstrap = bootstrapQuery.data as AppBootstrap | undefined;
  const user = bootstrap?.user;

  const generate = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await createPastLifeResult({ data: {} });
      if (!r.ok) {
        if (r.reason === "missing_chart") {
          setError("请先补全出生年月日时，戏命师才能翻你的旧账。");
        } else if (r.reason === "not_logged_in") {
          setError("请先登录");
        } else {
          setError("生成失败，请重试");
        }
      } else {
        setResult(r.result as Record<string, unknown>);
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }, []);

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

  return (
    <div className="min-h-screen bg-background text-bone flex flex-col items-center p-4 pt-12">
      <div className="max-w-md w-full space-y-6 text-center">
        <h1 className="font-display text-2xl text-gold">前世反差身份卡</h1>

        {!result && !loading && !error && (
          <div className="glass p-8 rounded-3xl border border-gold/15 space-y-4">
            <p className="text-sm text-muted-foreground">
              需要完整出生资料（含出生时辰）才能翻旧账。
            </p>
            <button
              onClick={generate}
              className="h-12 px-8 rounded-xl ritual-btn text-sm font-semibold"
            >
              生成我的前世身份
            </button>
            <p className="text-xs text-muted-foreground">
              如未输入出生资料，请先返回首页或微信中发送出生年月日时给戏命师。
            </p>
          </div>
        )}

        {loading && (
          <div className="py-12">
            <div className="w-10 h-10 mx-auto border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground mt-4">戏命师正在翻旧账...</p>
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
            <p className="text-xs text-muted-foreground">
              提示：发送出生年月日时给微信戏命师，例如「1995-06-15 22:00 女」
            </p>
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
              {(result.keywords as string[]).map((k) => (
                <span key={k} className="px-3 py-1 rounded-full bg-gold/10 text-xs text-gold">
                  {k}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{result.chartReasonShort as string}</p>
            <p className="text-sm italic text-bone/80 leading-relaxed">
              「{result.shortText as string}」
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(result.shareUrl as string);
                    alert("分享链接已复制！");
                  } catch {
                    alert("复制失败，请手动复制链接");
                  }
                }}
                className="w-full h-12 rounded-xl ritual-btn text-sm font-semibold"
              >
                复制分享链接
              </button>
            </div>

            <p className="text-[10px] text-muted-foreground">娱乐互动内容，不构成现实判断。</p>
          </div>
        )}

        <Link to="/" className="text-xs text-gold/50 hover:underline">
          ← 返回首页
        </Link>
      </div>
    </div>
  );
}
