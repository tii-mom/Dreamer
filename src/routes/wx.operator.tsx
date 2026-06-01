import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { verifyTicket } from "@/lib/api/xms.functions";
import { getOperatorStatus } from "@/lib/api/operator.functions";
import { PaymentPanel } from "@/components/PaymentPanel";
import { Sparkles, ChevronRight } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

const searchSchema = z.object({
  ticket: z.string().optional(),
});

export const Route = createFileRoute("/wx/operator")({
  validateSearch: searchSchema,
  component: WxOperator,
});

function WxOperator() {
  const { ticket } = Route.useSearch();
  const [showPayment, setShowPayment] = useState(false);

  const { data: auth } = useQuery({
    queryKey: ["wx-ticket", ticket],
    queryFn: () => verifyTicket({ data: { ticket: ticket ?? "" } }),
    enabled: !!ticket,
  });

  const statusQuery = useQuery({
    queryKey: ["operator-status"],
    queryFn: () => getOperatorStatus(),
  });

  const active = statusQuery.data?.active ?? false;

  if (!ticket || !auth?.valid) {
    return (
      <div className="min-h-screen bg-background text-bone flex flex-col items-center justify-center px-6 text-center">
        <Sparkles size={36} className="text-gold mb-4" />
        <h1 className="font-display text-lg text-gold mb-2">请从微信内打开</h1>
        <p className="text-xs text-muted-foreground max-w-xs">
          此页面需要通过戏命师微信机器人发送的链接访问
        </p>
      </div>
    );
  }

  if (active) {
    return (
      <div className="min-h-screen bg-background text-bone px-4 py-6 space-y-6 max-w-lg mx-auto">
        <div className="text-center py-10">
          <div className="text-4xl mb-3">🏮</div>
          <h1 className="font-display text-xl text-gold">经营者已激活</h1>
          <p className="text-xs text-muted-foreground mt-2">你的命铺经营者权限已生效</p>
          <Link
            to="/operator/dashboard"
            className="mt-6 inline-flex h-10 px-6 rounded-xl bg-gold/10 border border-gold/30 text-gold text-sm items-center justify-center gap-2"
          >
            进入面板 <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-bone px-4 py-6 space-y-6 max-w-lg mx-auto">
      <header className="text-center">
        <Link to="/" className="text-xs text-gold hover:underline">
          ← 返回首页
        </Link>
        <h1 className="font-display text-xl text-gold mt-1">命铺经营者</h1>
        <p className="text-xs text-muted-foreground">开通专属经营者特权</p>
      </header>

      <div className="space-y-3">
        <div className="bg-secondary/15 border border-gold/10 rounded-2xl p-4">
          <h3 className="font-display text-gold text-sm mb-1">专属命铺链接</h3>
          <p className="text-xs text-muted-foreground">生成独立归因链接与推广海报</p>
        </div>
        <div className="bg-secondary/15 border border-gold/10 rounded-2xl p-4">
          <h3 className="font-display text-gold text-sm mb-1">朋友圈文案</h3>
          <p className="text-xs text-muted-foreground">每日量身定制推广文案</p>
        </div>
        <div className="bg-secondary/15 border border-gold/10 rounded-2xl p-4">
          <h3 className="font-display text-gold text-sm mb-1">铭文卡槽 +2</h3>
          <p className="text-xs text-muted-foreground">额外装配位增强推演能力</p>
        </div>
      </div>

      <div className="text-center">
        <div className="font-display text-3xl text-gold mb-4">¥899</div>
        <button
          onClick={() => setShowPayment(true)}
          className="w-full h-12 rounded-xl bg-gold/10 border border-gold/30 text-gold font-semibold text-sm"
        >
          立即开通
        </button>
        <p className="text-[10px] text-muted-foreground mt-2">虚拟商品，支付后不支持退款</p>
      </div>

      {showPayment && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-secondary/40 border border-gold/25 rounded-2xl p-5">
            <PaymentPanel
              productCode="operator_899"
              onSuccess={() => {
                setShowPayment(false);
                statusQuery.refetch();
              }}
              onCancel={() => setShowPayment(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
