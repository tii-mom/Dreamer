import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { verifyTicket } from "@/lib/api/xms.functions";
import { fetchUserAssets, fetchEquipped } from "@/lib/api/assets.functions";
import { ScrollText, Sparkles } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({
  ticket: z.string().optional(),
});

export const Route = createFileRoute("/wx/assets")({
  validateSearch: searchSchema,
  component: WxAssets,
});

function WxAssets() {
  const { ticket } = Route.useSearch();

  const { data: auth } = useQuery({
    queryKey: ["wx-ticket", ticket],
    queryFn: () => verifyTicket({ data: { ticket: ticket ?? "" } }),
    enabled: !!ticket,
  });

  const assetsQuery = useQuery({
    queryKey: ["user-assets"],
    queryFn: () => fetchUserAssets(),
  });

  const equippedQuery = useQuery({
    queryKey: ["equipped-inscriptions"],
    queryFn: () => fetchEquipped(),
  });

  const assets = assetsQuery.data?.assets ?? [];
  const equipped = equippedQuery.data?.equipped ?? [];
  const equippedIds = new Set(equipped.map((e: { asset_id: string }) => e.asset_id));

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
        <h1 className="font-display text-xl text-gold mt-1">天命铭文背包</h1>
        <p className="text-xs text-muted-foreground">查看装配的命盘铭文</p>
      </header>

      <section>
        <h3 className="text-xs font-semibold text-gold mb-3">铭文资产 ({assets.length})</h3>
        {assets.length === 0 ? (
          <div className="text-center py-10 bg-secondary/10 rounded-2xl text-xs text-muted-foreground">
            背包空空如也
            <br />
            <Link to="/wx/blindbox" search={{ ticket }} className="text-gold hover:underline">
              前往盲盒商店
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {assets.map((ast: { id: string; assetCode: string; rarity: string; level: number }) => {
              const isEquipped = equippedIds.has(ast.id);
              return (
                <div
                  key={ast.id}
                  className={`rounded-xl p-3 border flex items-center justify-between ${
                    isEquipped ? "bg-gold/5 border-gold/25" : "bg-secondary/15 border-gold/10"
                  }`}
                >
                  <div>
                    <div className="text-sm text-bone font-semibold">
                      {ast.assetCode.replace("_rune", "").toUpperCase()} 铭文
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Lv.{ast.level} · {ast.rarity}
                    </div>
                  </div>
                  {isEquipped && (
                    <span className="text-[10px] bg-gold/15 text-gold px-2 py-0.5 rounded-full border border-gold/20">
                      已装配
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
