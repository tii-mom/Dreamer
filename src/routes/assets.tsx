import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchUserAssets, fetchEquipped, equipRune } from "@/lib/api/assets.functions";
import { Sparkles, ScrollText, Compass, CheckCircle } from "lucide-react";
import { useState } from "react";
import type { InscriptionEquip } from "@/lib/server/xms-blindbox.server";

export const Route = createFileRoute("/assets")({
  component: AssetsBackpack,
});

function AssetsBackpack() {
  const queryClient = useQueryClient();
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  const assetsQuery = useQuery({
    queryKey: ["user-assets"],
    queryFn: () => fetchUserAssets(),
  });

  const equippedQuery = useQuery({
    queryKey: ["equipped-inscriptions"],
    queryFn: () => fetchEquipped(),
  });

  const equipMutation = useMutation({
    mutationFn: (input: { assetId: string; slotIndex: number }) => equipRune({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipped-inscriptions"] });
      setSelectedAsset(null);
    },
  });

  const assets = assetsQuery.data?.assets ?? [];
  const equipped = equippedQuery.data?.equipped ?? [];

  // slots map
  const slotsCount = 4; // support up to 4 slots (default 2 + 2 for operators)
  const slotMap = new Map<number, InscriptionEquip>();
  equipped.forEach((eq) => {
    slotMap.set(eq.slot_index, eq);
  });

  const handleEquip = (slotIndex: number) => {
    if (!selectedAsset) return;
    equipMutation.mutate({ assetId: selectedAsset, slotIndex });
  };

  return (
    <div className="min-h-screen bg-background text-bone p-6 md:p-12 max-w-4xl mx-auto space-y-8 flex flex-col justify-center">
      <header className="border-b border-gold/20 pb-4">
        <Link to="/" className="text-xs text-gold hover:underline">
          ← 返回首页
        </Link>
        <h1 className="font-display text-3xl text-gold mt-1">天命铭文背包</h1>
        <p className="text-xs text-muted-foreground">
          查看和装配您的八字命盘铭文，改变微信戏命师推演行为和聊天风格。
        </p>
      </header>

      {/* Equipment Slots Grid */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gold flex items-center gap-2">
          <Compass size={16} />
          当前装配命理卡槽
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: slotsCount }).map((_, idx) => {
            const eq = slotMap.get(idx);
            const matchingAsset = eq ? assets.find((a) => a.id === eq.asset_id) : null;

            return (
              <div
                key={idx}
                onClick={() => eq && setSelectedAsset(eq.asset_id)}
                className={`h-24 rounded-2xl border flex flex-col items-center justify-center p-3 relative cursor-pointer transition-all ${
                  matchingAsset
                    ? "bg-gold/5 border-gold/30 hover:border-gold/60"
                    : "border-dashed border-gold/15 hover:border-gold/30 bg-black/10"
                }`}
              >
                <div className="absolute top-1 right-2 text-[8px] text-muted-foreground/60">
                  卡槽 #{idx + 1}
                </div>

                {matchingAsset ? (
                  <div className="text-center space-y-1">
                    <div className="text-xs text-gold font-semibold truncate max-w-[100px]">
                      {matchingAsset.assetCode.replace("_rune", "").toUpperCase()}
                    </div>
                    <div className="text-[9px] text-muted-foreground/80">
                      {matchingAsset.rarity}
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-1">
                    <span className="text-lg text-gold/30">+</span>
                    {selectedAsset ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEquip(idx);
                        }}
                        className="block text-[10px] text-accent hover:underline"
                      >
                        装配到此
                      </button>
                    ) : (
                      <div className="text-[9px] text-muted-foreground/40">空置</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Inventory Backpack */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gold flex items-center gap-2">
          <ScrollText size={16} />
          我拥有的铭文资产 ({assets.length})
        </h3>

        {assets.length === 0 ? (
          <div className="text-center py-12 glass rounded-2xl text-xs text-muted-foreground">
            背包空空如也，请前往
            <Link to="/blindbox" className="text-gold hover:underline mx-1">
              盲盒商店
            </Link>
            抽取您的第一枚铭文吧。
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {assets.map((ast) => {
              const isSelected = selectedAsset === ast.id;
              const isEquipped = equipped.some((e) => e.asset_id === ast.id);

              return (
                <div
                  key={ast.id}
                  onClick={() => setSelectedAsset(ast.id)}
                  className={`glass p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected ? "border-gold/60 bg-gold/5" : "border-gold/10 hover:border-gold/20"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="text-xs text-bone font-semibold">
                      {ast.assetCode.replace("_rune", "").toUpperCase()} 铭文
                    </div>
                    <div className="text-[10px] text-muted-foreground/60">
                      级别: Lv.{ast.level} | 品质: {ast.rarity}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isEquipped && (
                      <span className="text-[9px] bg-gold/15 text-gold border border-gold/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                        <CheckCircle size={10} />
                        已装配
                      </span>
                    )}
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
