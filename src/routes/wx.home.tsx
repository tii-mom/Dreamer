import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { verifyTicket } from "@/lib/api/xms.functions";
import { Sparkles } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({
  ticket: z.string().optional(),
});

export const Route = createFileRoute("/wx/home")({
  validateSearch: searchSchema,
  component: WxHome,
});

function WxHome() {
  const { ticket } = Route.useSearch();
  const { data: auth, isError } = useQuery({
    queryKey: ["wx-ticket", ticket],
    queryFn: () => verifyTicket({ data: { ticket: ticket ?? "" } }),
    enabled: !!ticket,
  });

  if (!ticket) {
    return <RequireBind />;
  }

  if (isError) {
    return <Expired />;
  }

  return (
    <div className="min-h-screen bg-background text-bone flex flex-col">
      <div className="flex-1 px-4 py-8 space-y-6 max-w-lg mx-auto w-full">
        <div className="text-center space-y-2">
          <div className="text-4xl">🔮</div>
          <h1 className="font-display text-xl text-gold">戏命师</h1>
          <p className="text-xs text-muted-foreground">微信里的 AI 命理师</p>
        </div>

        <div className="space-y-3">
          <Link
            to="/wx/blindbox"
            search={{ ticket }}
            className="block w-full p-4 rounded-2xl bg-secondary/30 border border-gold/15 text-center"
          >
            <div className="text-2xl mb-1">🎴</div>
            <div className="font-display text-gold">命师盲盒</div>
            <div className="text-xs text-muted-foreground mt-1">抽取稀有铭文</div>
          </Link>
          <Link
            to="/wx/assets"
            search={{ ticket }}
            className="block w-full p-4 rounded-2xl bg-secondary/30 border border-gold/15 text-center"
          >
            <div className="text-2xl mb-1">📜</div>
            <div className="font-display text-gold">铭文背包</div>
            <div className="text-xs text-muted-foreground mt-1">查看装配铭文</div>
          </Link>
          <Link
            to="/wx/operator"
            search={{ ticket }}
            className="block w-full p-4 rounded-2xl bg-secondary/30 border border-gold/15 text-center"
          >
            <div className="text-2xl mb-1">🏮</div>
            <div className="font-display text-gold">命铺经营者</div>
            <div className="text-xs text-muted-foreground mt-1">开通 ¥899 特权</div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function RequireBind() {
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

function Expired() {
  return (
    <div className="min-h-screen bg-background text-bone flex flex-col items-center justify-center px-6 text-center">
      <Sparkles size={36} className="text-gold mb-4" />
      <h1 className="font-display text-lg text-gold mb-2">链接已过期</h1>
      <p className="text-xs text-muted-foreground max-w-xs">
        请在微信中重新向戏命师发送命令获取新链接
      </p>
    </div>
  );
}
