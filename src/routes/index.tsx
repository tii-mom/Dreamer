import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, MessageSquare, ShieldAlert, Award, Compass } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "微信戏命师 · 把 AI 养进微信里" },
      {
        name: "description",
        content: "把戏命师养进你的微信里，一个会毒舌、会问命、会帮你经营朋友圈命铺的 AI 命师分身。",
      },
      { property: "og:title", content: "微信戏命师" },
      {
        property: "og:description",
        content: "微信原生 AI 命师经营网络 · 专属命铺 · 盲盒与铭文资产养成",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-bone flex flex-col font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 px-6 md:px-12 text-center max-w-4xl mx-auto space-y-8 flex flex-col items-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-primary/20 rounded-full blur-3xl -z-10" />
        <div className="absolute top-20 left-1/4 w-40 h-40 bg-accent/15 rounded-full blur-2xl -z-10" />

        {/* Logo Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/25 text-xs text-gold font-medium animate-pulse">
          <Sparkles size={13} />
          微信原生 AI 命师网络 已上线
        </div>

        <h1 className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold via-bone to-accent leading-tight max-w-3xl">
          把戏命师养进你的微信里
        </h1>

        <p className="text-base text-muted-foreground max-w-xl leading-relaxed">
          一个会毒舌、会问命、会帮你设计朋友圈命理服务菜单的 AI
          命师分身。直接在微信里与它聊天推演、抽取灵签。
        </p>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 w-full justify-center">
          <Link
            to="/bind"
            className="h-12 px-8 rounded-xl ritual-btn text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
          >
            <MessageSquare size={16} />
            绑定微信，领取我的戏命师
          </Link>
          <Link
            to="/operator"
            className="h-12 px-8 rounded-xl bg-secondary/80 border border-gold/30 text-gold text-sm font-semibold flex items-center justify-center gap-2 hover:bg-secondary/100 hover:scale-[1.02] transition-transform"
          >
            <Compass size={16} />
            开通 ¥899 命铺经营者
          </Link>
          <Link
            to="/try"
            className="h-12 px-6 rounded-xl bg-black/40 border border-gold/10 text-bone/70 text-xs flex items-center justify-center hover:text-bone hover:border-gold/20"
          >
            先体验网页版
          </Link>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6 py-12">
        <div className="glass p-6 rounded-2xl border border-gold/10 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 grid place-items-center text-xl">
            💬
          </div>
          <h3 className="text-base font-semibold text-gold">微信即时回复</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            支持「今日」、「感情」、「财运」、「工作」等指令快速响应，比你想象的更懂你，还会顺便怼你两句。
          </p>
        </div>

        <div className="glass p-6 rounded-2xl border border-gold/10 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 grid place-items-center text-xl">
            🎴
          </div>
          <h3 className="text-base font-semibold text-gold">盲盒与铭文养成</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            抽盲盒获取个性命师分身与特定卦象铭文。装配铭文能直接影响机器人的对话风格与命理推演深度。
          </p>
        </div>

        <div className="glass p-6 rounded-2xl border border-gold/10 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 grid place-items-center text-xl">
            🏮
          </div>
          <h3 className="text-base font-semibold text-gold">命铺经营者特权</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            开通掌柜身份，获取专属测算码与微信朋友圈每日推广文案，让好友扫码进入你的命铺玩耍，获取香火值奖励。
          </p>
        </div>
      </section>

      {/* Disclaimer / Compliance Box */}
      <footer className="mt-auto border-t border-gold/10 bg-secondary/20 py-8 px-6 text-center space-y-4">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground text-left max-w-lg">
            <ShieldAlert size={16} className="text-gold shrink-0" />
            <span>
              <strong>免责与娱乐声明</strong>：本产品为娱乐互动、民俗排盘与虚拟内容工具，生成结果由
              AI 推演，不构成任何医疗诊断、心理辅导或财务投资决策建议。
            </span>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground/80 font-medium">
            <Link to="/terms" className="hover:text-gold hover:underline">
              用户协议
            </Link>
            <span>·</span>
            <Link to="/privacy" className="hover:text-gold hover:underline">
              隐私政策
            </Link>
            <span>·</span>
            <Link to="/refund" className="hover:text-gold hover:underline">
              退款规则
            </Link>
            <span>·</span>
            <Link to="/disclaimer" className="hover:text-gold hover:underline">
              免责声明
            </Link>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground/40">© 2026 戏命师 all rights reserved.</p>
      </footer>
    </div>
  );
}
