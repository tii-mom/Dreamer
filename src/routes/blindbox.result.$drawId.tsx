import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDrawResult } from "@/lib/api/assets.functions";
import { Sparkles, Home, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/blindbox/result/$drawId")({
  component: BlindboxResult,
});

function BlindboxResult() {
  const { drawId } = Route.useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["blindbox-result", drawId],
    queryFn: () => getDrawResult({ data: { drawId } }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-bone flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-background text-bone flex flex-col items-center justify-center px-6 text-center">
        <div className="text-4xl mb-4">❌</div>
        <h1 className="font-display text-lg text-gold mb-2">结果未找到</h1>
        <p className="text-xs text-muted-foreground">该抽卡记录不存在或已过期</p>
        <Link
          to="/blindbox"
          className="mt-6 h-10 px-6 rounded-xl ritual-btn text-xs inline-flex items-center"
        >
          返回盲盒商店
        </Link>
      </div>
    );
  }

  const results = data.results ?? [];
  const boxType = data.boxType;

  return (
    <div className="min-h-screen bg-background text-bone px-4 py-8 max-w-lg mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="text-4xl">🔮</div>
        <h1 className="font-display text-xl text-gold">
          {boxType === "blindbox_ten" ? "十连抽结果" : "单抽结果"}
        </h1>
        <p className="text-xs text-muted-foreground">命盘已开，天机显现</p>
      </div>

      <div className="space-y-3">
        {results.map(
          (
            r: { name: string; rarity: string; effectDescription: string; manifestAssetId: string },
            idx: number,
          ) => {
            const rarityColors: Record<string, string> = {
              normal: "border-gray-500/30 bg-gray-500/5",
              rare: "border-blue-500/30 bg-blue-500/5",
              epic: "border-purple-500/30 bg-purple-500/5",
              legendary: "border-yellow-500/30 bg-yellow-500/5",
            };
            const colorClass = rarityColors[r.rarity] ?? rarityColors.normal;

            return (
              <div key={idx} className={`rounded-2xl border p-4 ${colorClass} space-y-2`}>
                <div className="flex items-center justify-between">
                  <span className="font-display text-gold text-sm">{r.name}</span>
                  <span className="text-[10px] text-muted-foreground uppercase">{r.rarity}</span>
                </div>
                <p className="text-xs text-muted-foreground">{r.effectDescription}</p>
              </div>
            );
          },
        )}
      </div>

      <div className="flex gap-3 justify-center pt-4">
        <Link
          to="/blindbox"
          className="h-10 px-5 rounded-xl bg-secondary/70 border border-gold/20 text-bone text-xs inline-flex items-center gap-2"
        >
          <Sparkles size={14} />
          继续抽取
        </Link>
        <Link
          to="/wx/assets"
          className="h-10 px-5 rounded-xl ritual-btn text-xs inline-flex items-center gap-2"
        >
          <Home size={14} />
          查看铭文
        </Link>
      </div>

      <div className="text-center">
        <p className="text-[10px] text-muted-foreground">在微信中向戏命师发送「铭文」查看装配</p>
      </div>
    </div>
  );
}
