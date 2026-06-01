import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { verifyTicket } from "@/lib/api/xms.functions";
import { fetchBlindboxDraws } from "@/lib/api/assets.functions";
import { PaymentPanel } from "@/components/PaymentPanel";
import { Sparkles, ShoppingBag, ShieldAlert } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({
  ticket: z.string().optional(),
});

export const Route = createFileRoute("/wx/blindbox")({
  validateSearch: searchSchema,
  component: WxBlindbox,
});

function WxBlindbox() {
  const { ticket } = Route.useSearch();

  const { data: auth } = useQuery({
    queryKey: ["wx-ticket", ticket],
    queryFn: () => verifyTicket({ data: { ticket: ticket ?? "" } }),
    enabled: !!ticket,
  });

  const [selectedSku, setSelectedSku] = useState<"blindbox_single" | "blindbox_ten" | null>(null);

  const drawsQuery = useQuery({
    queryKey: ["blindbox-draws"],
    queryFn: () => fetchBlindboxDraws(),
  });

  const draws = drawsQuery.data?.draws ?? [];

  const handlePaymentSuccess = () => {
    drawsQuery.refetch();
    setSelectedSku(null);
  };

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

  return (
    <div className="min-h-screen bg-background text-bone px-4 py-6 space-y-6 max-w-lg mx-auto">
      <header className="text-center">
        <Link to="/" className="text-xs text-gold hover:underline">
          ← 返回首页
        </Link>
        <h1 className="font-display text-xl text-gold mt-1">命师盲盒商店</h1>
        <p className="text-xs text-muted-foreground">随机抽取稀有铭文</p>
      </header>

      <div className="space-y-4">
        <div
          onClick={() => setSelectedSku("blindbox_single")}
          className="bg-secondary/20 border border-gold/15 rounded-2xl p-5 text-center space-y-2"
        >
          <div className="text-3xl">🎴</div>
          <h3 className="font-display text-gold">盲盒单抽</h3>
          <p className="text-xs text-muted-foreground">随机获取 1 个铭文道具</p>
          <div className="font-display text-lg text-gold">¥99</div>
        </div>

        <div
          onClick={() => setSelectedSku("blindbox_ten")}
          className="bg-secondary/20 border border-gold/15 rounded-2xl p-5 text-center space-y-2 relative overflow-hidden"
        >
          <div className="absolute top-2 right-2 bg-gold/20 text-gold text-[10px] font-semibold px-2 py-0.5 rounded-full">
            超值
          </div>
          <div className="text-3xl">🔮</div>
          <h3 className="font-display text-gold">豪华十连抽</h3>
          <p className="text-xs text-muted-foreground">必出史诗以上铭文</p>
          <div className="font-display text-lg text-gold">¥888</div>
        </div>
      </div>

      {selectedSku && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-secondary/40 border border-gold/25 rounded-2xl p-5 space-y-4">
            <h3 className="font-display text-gold text-center">
              {selectedSku === "blindbox_single" ? "单抽盲盒" : "十连盲盒"}
            </h3>
            <PaymentPanel
              productCode={selectedSku}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setSelectedSku(null)}
            />
          </div>
        </div>
      )}

      <div className="bg-secondary/20 border border-gold/10 rounded-2xl p-4 text-xs text-muted-foreground">
        <p className="flex items-center gap-1.5 text-gold font-semibold mb-2">
          <ShieldAlert size={14} />
          概率公示
        </p>
        <p>普通 70.0% | 稀有 20.0% | 史诗 9.5% | 传说 0.5%</p>
        <p className="mt-2">虚拟商品，支付后不支持退款</p>
      </div>

      {draws.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-gold flex items-center gap-2">
            <ShoppingBag size={16} />
            近期记录
          </h3>
          <div className="space-y-2">
            {draws
              .slice(0, 5)
              .map(
                (d: {
                  id: string;
                  boxType: string;
                  resultJson: string;
                  probabilityVersion: string;
                  createdAt: string;
                }) => (
                  <div
                    key={d.id}
                    className="bg-secondary/15 border border-gold/5 rounded-xl p-3 text-xs"
                  >
                    <span className="text-bone">
                      {d.boxType === "blindbox_single" ? "单抽" : "十连"}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      {new Date(d.createdAt).toLocaleString()}
                    </span>
                  </div>
                ),
              )}
          </div>
        </section>
      )}
    </div>
  );
}
