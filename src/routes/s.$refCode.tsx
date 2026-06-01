import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { bindReferralSession } from "@/lib/api/operator.functions";
import { Sparkles, MessageSquare } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/s/$refCode")({
  component: ReferralLanding,
});

function ReferralLanding() {
  const { refCode } = Route.useParams();

  const bindQuery = useQuery({
    queryKey: ["referral-bind", refCode],
    queryFn: () => bindReferralSession({ data: { referralCode: refCode } }),
  });

  return (
    <div className="min-h-screen bg-background text-bone flex flex-col">
      <div className="flex-1 px-4 py-8 space-y-6 max-w-lg mx-auto w-full">
        {bindQuery.isError ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-4">🔮</div>
            <h1 className="font-display text-lg text-gold mb-2">链接无效</h1>
            <p className="text-xs text-muted-foreground">此推广链接不存在或已失效</p>
            <Link
              to="/"
              className="mt-6 inline-flex h-10 px-6 rounded-xl ritual-btn text-xs items-center"
            >
              返回首页
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center space-y-3">
              <div className="text-5xl">🏮</div>
              <h1 className="font-display text-xl text-gold">
                命铺 · <span className="text-bone">{refCode}</span>
              </h1>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                活动归因期内，通过专属链接产生的互动和消费，会计入命铺香火值。平台不承诺任何固定现金收益。
              </p>
            </div>

            <div className="space-y-3">
              <div className="bg-secondary/20 border border-gold/10 rounded-2xl p-5 text-center space-y-3">
                <div className="text-3xl">🔮</div>
                <h2 className="font-display text-gold">今日运势</h2>
                <p className="text-xs text-muted-foreground">查看今日流日运势、吉时和财神方位</p>
                <Link
                  to="/try"
                  className="inline-flex h-10 px-6 rounded-xl bg-gold/10 border border-gold/30 text-gold text-xs items-center justify-center gap-2"
                >
                  <Sparkles size={14} />
                  体验今日问事
                </Link>
              </div>

              <div className="bg-secondary/20 border border-gold/10 rounded-2xl p-5 text-center space-y-3">
                <div className="text-3xl">🎴</div>
                <h2 className="font-display text-gold">命师盲盒</h2>
                <p className="text-xs text-muted-foreground">抽取稀有铭文，增强命理推演能力</p>
                <Link
                  to="/blindbox"
                  className="inline-flex h-10 px-6 rounded-xl ritual-btn text-xs items-center justify-center gap-2"
                >
                  开启盲盒
                </Link>
              </div>

              <div className="bg-secondary/20 border border-gold/10 rounded-2xl p-5 text-center space-y-3">
                <div className="text-3xl">💬</div>
                <h2 className="font-display text-gold">绑定微信</h2>
                <p className="text-xs text-muted-foreground">把戏命师养进你的微信，随时问事</p>
                <Link
                  to="/bind"
                  className="inline-flex h-10 px-6 rounded-xl ritual-btn text-xs items-center justify-center gap-2"
                >
                  <MessageSquare size={14} />
                  立即绑定
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
