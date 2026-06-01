import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/bind/success")({
  component: BindSuccess,
});

function BindSuccess() {
  return (
    <div className="min-h-screen bg-background text-bone flex flex-col justify-center items-center p-6">
      <div className="max-w-md w-full glass p-8 rounded-3xl border border-gold/15 space-y-6 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute -top-12 -left-12 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl" />

        <header className="space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 grid place-items-center text-3xl shadow-lg shadow-emerald-500/20">
            ✅
          </div>
          <h1 className="font-display text-2xl text-gold tracking-wide">微信绑定成功！</h1>
          <p className="text-xs text-muted-foreground">戏命师已成功入驻您的微信聊天列表</p>
        </header>

        <section className="bg-secondary/40 border border-gold/10 rounded-2xl p-5 text-left space-y-3">
          <h2 className="text-sm font-semibold text-gold">现在回到微信中，发送以下指令体验：</h2>
          <ul className="space-y-2 text-xs text-muted-foreground font-mono">
            <li>
              🍀 发送「<span className="text-gold">今日</span>」— 查看今日流日与避忌
            </li>
            <li>
              ❤️ 发送「<span className="text-gold">感情</span>」— 算算桃花与正缘
            </li>
            <li>
              💰 发送「<span className="text-gold">财运</span>」— 了解今日财富方位
            </li>
            <li>
              🎴 发送「<span className="text-gold">抽签</span>」— 获取当日吉凶灵签
            </li>
            <li>
              🎮 发送「<span className="text-gold">帮助</span>」— 查看所有隐藏指令
            </li>
          </ul>
        </section>

        <div className="pt-2 flex justify-center gap-4">
          <Link
            to="/try"
            className="px-5 h-10 rounded-xl bg-secondary/70 border border-gold/20 text-bone text-xs flex items-center justify-center"
          >
            去网页版看看
          </Link>
          <Link
            to="/"
            className="px-5 h-10 rounded-xl ritual-btn text-xs font-semibold flex items-center justify-center"
          >
            回到首页
          </Link>
        </div>
      </div>
    </div>
  );
}
