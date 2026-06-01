import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { ensureSession } from "@/lib/api/xms.functions";
import { createClawbotBindTicket, queryClawbotBindTicketStatus } from "@/lib/api/bind.functions";
import type { AppBootstrap } from "@/lib/domain";

type BindTicketData = {
  ticket: string;
  bindCode: string;
  expiresAt: string;
} | null;

export const Route = createFileRoute("/bind")({
  component: BindWechat,
});

function BindWechat() {
  const [bindTicket, setBindTicket] = useState<BindTicketData>(null);
  const [bound, setBound] = useState(false);
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const bootstrapQuery = useQuery({
    queryKey: ["xms-bootstrap"],
    queryFn: () => ensureSession(),
  });
  const bootstrap = bootstrapQuery.data as AppBootstrap | undefined;

  const createTicket = useCallback(async () => {
    setLoading(true);
    setError("");
    setBound(false);
    setExpired(false);

    try {
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get("ref") || undefined;

      const result = await createClawbotBindTicket({
        data: {
          scene: refCode ? "referral" : "bind",
          referralCode: refCode,
        },
      });

      setBindTicket(result);

      const expiresTime = new Date(result.expiresAt).getTime();
      const now = Date.now();
      setTimeLeft(Math.max(0, Math.floor((expiresTime - now) / 1000)));
    } catch (err) {
      setError("生成绑定码失败，请重试");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    createTicket();
  }, [createTicket]);

  useEffect(() => {
    if (!bindTicket) return;

    const countdown = setInterval(() => {
      const expiresTime = new Date(bindTicket.expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiresTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setExpired(true);
        clearInterval(countdown);
      }
    }, 1000);

    return () => clearInterval(countdown);
  }, [bindTicket]);

  useEffect(() => {
    if (!bindTicket || bound || expired) return;

    const poll = setInterval(async () => {
      try {
        const status = await queryClawbotBindTicketStatus({
          data: { ticket: bindTicket.ticket },
        });

        if (status.bound) {
          setBound(true);
          setTimeout(() => {
            window.location.href = "/bind/success";
          }, 500);
        }
        if (status.expired) {
          setExpired(true);
        }
      } catch {
        // Ignore polling errors
      }
    }, 2000);

    return () => clearInterval(poll);
  }, [bindTicket, bound, expired]);

  const copyBindCode = () => {
    if (!bindTicket) return;
    navigator.clipboard.writeText(bindTicket.bindCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen bg-background text-bone flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full glass p-6 rounded-3xl border border-gold/15 space-y-5 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-20 h-20 bg-gold/10 rounded-full blur-xl" />
        <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-primary/10 rounded-full blur-xl" />

        <header className="space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent grid place-items-center text-2xl shadow-lg shadow-primary/20">
            💬
          </div>
          <h1 className="font-display text-xl text-gold tracking-wide">把戏命师养进微信</h1>
          <p className="text-xs text-muted-foreground">
            绑定后，可通过微信直接和戏命师对话、抽签、抽盲盒
          </p>
        </header>

        {loading && (
          <div className="py-8">
            <div className="w-8 h-8 mx-auto border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground mt-3">正在生成绑定码...</p>
          </div>
        )}

        {error && !loading && (
          <div className="space-y-3">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={createTicket}
              className="h-10 px-6 rounded-xl ritual-btn text-xs font-semibold"
            >
              重试
            </button>
          </div>
        )}

        {bindTicket && !loading && (
          <>
            <section className="bg-secondary/40 border border-gold/10 rounded-2xl p-4 space-y-3">
              <h2 className="text-sm font-semibold text-gold text-left">第一步：添加微信机器人</h2>
              <div className="flex items-center gap-3 bg-black/30 rounded-xl p-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-400 grid place-items-center text-lg flex-shrink-0">
                  🤖
                </div>
                <div className="text-left">
                  <p className="text-sm text-bone font-semibold">ClawBot_XMS</p>
                  <p className="text-[10px] text-muted-foreground">微信搜索并添加该机器人</p>
                </div>
              </div>
            </section>

            <section className="bg-secondary/40 border border-gold/10 rounded-2xl p-4 space-y-3">
              <h2 className="text-sm font-semibold text-gold text-left">第二步：发送绑定码</h2>
              <p className="text-xs text-muted-foreground text-left">
                在微信中向 ClawBot_XMS 发送以下绑定码：
              </p>

              <div className="bg-black/40 border-2 border-gold/30 rounded-2xl p-4">
                <div className="text-3xl font-mono font-bold text-gold tracking-[0.3em] select-all">
                  {bindTicket.bindCode}
                </div>
              </div>

              <button
                onClick={copyBindCode}
                className="w-full h-10 rounded-xl bg-gold/10 border border-gold/30 text-gold text-xs font-semibold hover:bg-gold/20 transition-colors"
              >
                {copied ? "✓ 已复制绑定码" : "📋 点击复制绑定码"}
              </button>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <span
                  className={`w-2 h-2 rounded-full ${timeLeft > 60 ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`}
                />
                {timeLeft > 0 ? `剩余 ${minutes}:${String(seconds).padStart(2, "0")}` : "已过期"}
              </div>
            </section>

            {!bound && !expired && (
              <div className="text-xs text-gold animate-pulse">
                ⏳ 等待微信绑定中...（自动检测）
              </div>
            )}

            {bound && (
              <div className="text-sm text-emerald-400 font-semibold">✅ 绑定成功！正在跳转...</div>
            )}

            {expired && !bound && (
              <button
                onClick={createTicket}
                className="h-10 px-6 rounded-xl ritual-btn text-xs font-semibold"
              >
                重新生成绑定码
              </button>
            )}
          </>
        )}

        <footer className="pt-2 text-xs">
          <Link to="/" className="text-gold hover:underline">
            ← 返回首页
          </Link>
        </footer>
      </div>
    </div>
  );
}
