import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ensureSession } from "@/lib/api/xms.functions";
import type { AppBootstrap } from "@/lib/domain";

export const Route = createFileRoute("/bind")({
  component: BindWechat,
});

function BindWechat() {
  const navigate = useNavigate();
  const [bindCodeInput, setBindCodeInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bootstrapQuery = useQuery({
    queryKey: ["xms-bootstrap"],
    queryFn: () => ensureSession(),
  });
  const bootstrap = bootstrapQuery.data as AppBootstrap | undefined;
  const user = bootstrap?.user;

  const handleMockBind = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bindCodeInput.trim()) return;
    setLoading(true);
    // Mock binding via ClawBot webhook simulator
    setTimeout(() => {
      setLoading(false);
      navigate({ to: "/bind/success" });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background text-bone flex flex-col justify-center items-center p-6">
      <div className="max-w-md w-full glass p-8 rounded-3xl border border-gold/15 space-y-6 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute -top-12 -left-12 w-24 h-24 bg-gold/10 rounded-full blur-xl" />
        <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-primary/10 rounded-full blur-xl" />

        <header className="space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent grid place-items-center text-3xl shadow-lg shadow-primary/20">
            💬
          </div>
          <h1 className="font-display text-2xl text-gold tracking-wide">把戏命师养进微信</h1>
          <p className="text-xs text-muted-foreground">
            绑定后，可通过微信直接和戏命师对话、抽签、抽盲盒
          </p>
        </header>

        <section className="space-y-4">
          <div className="bg-secondary/40 border border-gold/10 rounded-2xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-gold text-left">第一步：添加微信机器人</h2>
            <p className="text-xs text-muted-foreground text-left leading-relaxed">
              请扫码或添加微信号：<strong className="text-gold">ClawBot_XMS</strong> 并发送消息：“
              <span className="text-gold">起运</span>”
            </p>
            <div className="w-40 h-40 mx-auto bg-white p-2 rounded-2xl border border-gold/20 flex items-center justify-center">
              {/* Mock QR code container */}
              <div className="w-full h-full bg-secondary/80 rounded-xl grid place-items-center text-[10px] text-muted-foreground font-display">
                微信扫码添加
              </div>
            </div>
          </div>

          <div className="bg-secondary/40 border border-gold/10 rounded-2xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-gold text-left">第二步：绑定网页账户</h2>
            {user && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground text-left">
                  在微信中回复您的网页版绑定恢复码：
                </p>
                <div className="flex items-center justify-between bg-black/40 border border-gold/10 p-2 px-3 rounded-lg">
                  <code className="text-xs text-gold font-mono">{user.recoveryCode}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(user.recoveryCode);
                      alert("恢复码已复制！");
                    }}
                    className="text-[10px] text-accent hover:underline"
                  >
                    复制恢复码
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="pt-2">
          <form onSubmit={handleMockBind} className="space-y-3">
            <div className="text-xs text-muted-foreground text-left">
              绑定微信（输入 Provider ID）：
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="例如: wechat_user_123"
                value={bindCodeInput}
                onChange={(e) => setBindCodeInput(e.target.value)}
                className="flex-1 h-10 px-3 rounded-xl bg-secondary/60 border border-gold/20 text-xs text-bone outline-none focus-visible:ring-1 focus-visible:ring-gold"
              />
              <button
                type="submit"
                disabled={loading}
                className="h-10 px-4 rounded-xl ritual-btn text-xs font-semibold disabled:opacity-60 whitespace-nowrap"
              >
                {loading ? "绑定中..." : "确认绑定"}
              </button>
            </div>
          </form>
        </div>

        <footer className="pt-2 text-xs">
          <Link to="/" className="text-gold hover:underline">
            ← 返回首页
          </Link>
        </footer>
      </div>
    </div>
  );
}
