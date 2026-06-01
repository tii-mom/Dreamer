import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PaymentPanel } from "@/components/PaymentPanel";
import { useQuery } from "@tanstack/react-query";
import { fetchBlindboxDraws } from "@/lib/api/assets.functions";
import type { BlindboxDraw } from "@/lib/server/xms-blindbox.server";
import { Sparkles, ShoppingBag, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/blindbox")({
  component: BlindboxStore,
});

function BlindboxStore() {
  const [selectedSku, setSelectedSku] = useState<"blindbox_single" | "blindbox_ten" | null>(null);

  const drawsQuery = useQuery({
    queryKey: ["blindbox-draws"],
    queryFn: () => fetchBlindboxDraws(),
  });

  const draws = drawsQuery.data?.draws ?? [];

  const handlePaymentSuccess = () => {
    // Invalidate history query
    drawsQuery.refetch();
    setSelectedSku(null);
  };

  return (
    <div className="min-h-screen bg-background text-bone p-6 md:p-12 max-w-4xl mx-auto space-y-8 flex flex-col justify-center">
      <header className="border-b border-gold/20 pb-4">
        <Link to="/" className="text-xs text-gold hover:underline">
          ← 返回首页
        </Link>
        <h1 className="font-display text-3xl text-gold mt-1">命师盲盒商店</h1>
        <p className="text-xs text-muted-foreground">
          随机抽取特定命格、高阶铭文，强化您的微信戏命师！
        </p>
      </header>

      {/* Main SKUs Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-3xl border border-gold/10 space-y-4 text-center flex flex-col justify-between h-72">
          <div className="space-y-2">
            <div className="text-4xl">🎴</div>
            <h3 className="font-display text-lg text-gold">盲盒单抽</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              随机获取 1 个稀有铭文道具或基础命理碎片资源。适合尝鲜与微调流派。
            </p>
          </div>
          <button
            onClick={() => setSelectedSku("blindbox_single")}
            className="h-10 rounded-xl ritual-btn text-xs font-semibold"
          >
            获取单抽 (¥99.00)
          </button>
        </div>

        <div className="glass p-6 rounded-3xl border border-gold/10 space-y-4 text-center flex flex-col justify-between h-72 relative overflow-hidden">
          <div className="absolute top-2 right-2 bg-gold/20 text-gold text-[10px] font-semibold px-2 py-0.5 rounded-full">
            超值必得史诗
          </div>
          <div className="space-y-2">
            <div className="text-4xl">🔮</div>
            <h3 className="font-display text-lg text-gold">豪华十连抽</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              批量获取 10 个铭文道具，首发十连保底必出地璇级（史诗）以上铭文！
            </p>
          </div>
          <button
            onClick={() => setSelectedSku("blindbox_ten")}
            className="h-10 rounded-xl ritual-btn text-xs font-semibold"
          >
            获取十连 (¥888.00)
          </button>
        </div>
      </section>

      {/* Payment Overlay Modal */}
      {selectedSku && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="max-w-md w-full glass p-6 rounded-3xl border border-gold/25 space-y-4 shadow-2xl relative">
            <h3 className="font-display text-lg text-gold text-center">
              支付订单：{selectedSku === "blindbox_single" ? "单抽盲盒" : "十连盲盒"}
            </h3>
            <PaymentPanel
              productCode={selectedSku}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setSelectedSku(null)}
            />
          </div>
        </div>
      )}

      {/* Probabilities Disclosure & Disclaimer */}
      <section className="bg-secondary/40 border border-gold/10 rounded-2xl p-5 text-xs text-muted-foreground space-y-3">
        <h3 className="font-display font-semibold text-gold flex items-center gap-1.5">
          <ShieldAlert size={14} className="text-gold" />
          盲盒概率公示 & 理性消费提示
        </h3>
        <p className="leading-relaxed">
          普通铭文：70.0% | 稀有铭文：20.0% | 史诗铭文：9.5% | 传说铭文：0.5%。
        </p>
        <p className="leading-relaxed">
          *
          提示：盲盒抽取结果具有随机性，为数字化虚拟商品，支付完成后不支持退款。请各位道友合理安排开支，理性消费。
        </p>
      </section>

      {/* Draw History */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gold flex items-center gap-2">
          <ShoppingBag size={16} />
          近期抽卡记录
        </h3>

        {draws.length === 0 ? (
          <div className="text-center py-10 glass rounded-2xl text-xs text-muted-foreground">
            尚无抽取历史。
          </div>
        ) : (
          <div className="space-y-2">
            {draws.map((d: BlindboxDraw) => {
              const items = JSON.parse(d.resultJson || "[]") as Array<{
                assetCode: string;
                rarity: string;
              }>;
              return (
                <div
                  key={d.id}
                  className="glass p-4 rounded-xl border border-gold/5 flex justify-between items-center gap-4 text-xs"
                >
                  <div>
                    <div className="text-bone">
                      {d.boxType === "blindbox_single" ? "单抽盲盒" : "十连盲盒"}
                    </div>
                    <div className="text-[10px] text-muted-foreground/60 mt-1 font-mono">
                      概率版本: {d.probabilityVersion} | {new Date(d.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 max-w-xs justify-end">
                    {items.map((it, idx) => (
                      <span
                        key={idx}
                        className="bg-gold/10 text-gold text-[10px] px-2 py-0.5 rounded-full border border-gold/15"
                      >
                        {it.assetCode.replace("_rune", "")} ({it.rarity})
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
