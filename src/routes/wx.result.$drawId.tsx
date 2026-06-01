import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDrawResult } from "@/lib/api/assets.functions";
import { verifyTicket } from "@/lib/api/xms.functions";
import { Sparkles, MessageSquare } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({
  ticket: z.string().optional(),
});

export const Route = createFileRoute("/wx/result/$drawId")({
  validateSearch: searchSchema,
  component: WxResult,
});

function WxResult() {
  const { drawId } = Route.useParams();
  const { ticket } = Route.useSearch();

  const { data: auth } = useQuery({
    queryKey: ["wx-ticket", ticket],
    queryFn: () => verifyTicket({ data: { ticket: ticket ?? "" } }),
    enabled: !!ticket,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["blindbox-result", drawId],
    queryFn: () => getDrawResult({ data: { drawId } }),
  });

  if (!ticket || !auth?.valid) {
    return (
      <div className="min-h-screen bg-background text-bone flex flex-col items-center justify-center px-6 text-center">
        <Sparkles size={36} className="text-gold mb-4" />
        <h1 className="font-display text-lg text-gold mb-2">请从微信内打开</h1>
        <p className="text-xs text-muted-foreground">
          此页面需要通过戏命师微信机器人发送的链接访问
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-bone flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background text-bone flex flex-col items-center justify-center px-6 text-center">
        <div className="text-4xl mb-4">❌</div>
        <h1 className="font-display text-lg text-gold mb-2">结果未找到</h1>
      </div>
    );
  }

  const results = data.results ?? [];

  return (
    <div className="min-h-screen bg-background text-bone px-4 py-8 max-w-lg mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="text-4xl">🔮</div>
        <h1 className="font-display text-xl text-gold">
          {data.boxType === "blindbox_ten" ? "十连抽结果" : "抽卡结果"}
        </h1>
      </div>

      <div className="space-y-3">
        {results.map(
          (r: { name: string; rarity: string; effectDescription: string }, idx: number) => {
            const colorMap: Record<string, string> = {
              normal: "border-gray-500/30 bg-gray-500/5",
              rare: "border-blue-500/30 bg-blue-500/5",
              epic: "border-purple-500/30 bg-purple-500/5",
              legendary: "border-yellow-500/30 bg-yellow-500/5",
            };
            return (
              <div
                key={idx}
                className={`rounded-2xl border p-4 ${colorMap[r.rarity] ?? colorMap.normal} space-y-1`}
              >
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
          to="/wx/blindbox"
          search={{ ticket }}
          className="h-10 px-5 rounded-xl ritual-btn text-xs inline-flex items-center gap-2"
        >
          <Sparkles size={14} /> 继续抽取
        </Link>
        <Link
          to="/wx/assets"
          search={{ ticket }}
          className="h-10 px-5 rounded-xl bg-secondary/70 border border-gold/20 text-bone text-xs inline-flex items-center gap-2"
        >
          <MessageSquare size={14} /> 查看铭文
        </Link>
      </div>

      <div className="text-center">
        <p className="text-[10px] text-muted-foreground">回微信发送「铭文」查看装配</p>
      </div>
    </div>
  );
}
