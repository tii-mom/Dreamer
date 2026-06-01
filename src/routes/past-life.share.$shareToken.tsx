import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { queryPastLifeResult } from "@/lib/api/past-life.functions";

export const Route = createFileRoute("/past-life/share/$shareToken")({
  component: PastLifeShare,
});

function PastLifeShare() {
  const { shareToken } = Route.useParams();

  const query = useQuery({
    queryKey: ["past-life-share", shareToken],
    queryFn: () => queryPastLifeResult({ data: { shareToken } }),
  });
  const result = query.data?.result;

  const campLabels: Record<string, string> = {
    power: "权谋系",
    wealth: "财帛系",
    love: "桃花系",
    jianghu: "江湖系",
    immortal: "仙门系",
    underworld: "地府系",
  };
  const rarityLabels: Record<string, string> = {
    normal: "普通",
    rare: "稀有",
    epic: "史诗",
    legendary: "传说",
  };

  if (query.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-background text-bone flex flex-col items-center justify-center p-4 gap-4">
        <p className="text-sm text-muted-foreground">身份卡不存在或已过期</p>
        <Link to="/past-life" className="text-gold text-sm hover:underline">
          测我的前世身份 →
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-bone flex flex-col items-center p-4 pt-12">
      <div className="max-w-md w-full glass p-6 rounded-3xl border border-gold/15 space-y-5 text-center">
        <div className="text-5xl">📜</div>
        <p className="text-sm text-muted-foreground">你朋友测出了「{result.title as string}」</p>
        <h2 className="font-display text-xl text-gold">{result.title as string}</h2>
        <p className="text-sm text-muted-foreground">{result.rank as string}</p>
        <p className="text-xs text-gold">
          {rarityLabels[result.rarity as string] || (result.rarity as string)}｜命格池稀有
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {(result.keywords as string[]).map((k) => (
            <span key={k} className="px-3 py-1 rounded-full bg-gold/10 text-xs text-gold">
              {k}
            </span>
          ))}
        </div>
        <p className="text-sm italic text-bone/80 leading-relaxed">
          「{result.shortText as string}」
        </p>

        <div className="pt-4 space-y-3">
          <p className="text-sm text-bone">你会是什么前世身份？</p>
          <Link
            to="/past-life"
            className="block w-full h-12 rounded-xl ritual-btn text-sm font-semibold flex items-center justify-center"
          >
            测我的前世身份 →
          </Link>
          <Link
            to="/bind"
            className="block w-full h-12 rounded-xl bg-secondary/40 border border-gold/20 text-bone text-xs flex items-center justify-center"
          >
            绑定微信戏命师，随时随地测命盘
          </Link>
        </div>

        <p className="text-[10px] text-muted-foreground">娱乐互动内容，不构成现实判断。</p>
      </div>
    </div>
  );
}
