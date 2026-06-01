import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getOperatorStatus } from "@/lib/api/operator.functions";
import {
  Compass,
  Users,
  Coins,
  Award,
  Link as LinkIcon,
  FileText,
  CheckCircle,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/operator/dashboard")({
  component: OperatorDashboard,
});

function OperatorDashboard() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const statusQuery = useQuery({
    queryKey: ["operator-status"],
    queryFn: () => getOperatorStatus(),
  });

  const active = statusQuery.data?.active ?? false;
  const details = statusQuery.data?.details;
  const stats = statusQuery.data?.stats;

  if (statusQuery.isSuccess && !active) {
    navigate({ to: "/operator" });
    return null;
  }

  const promoLink = details ? `${window.location.origin}/s/${details.referralCode}` : "";

  const handleCopyLink = () => {
    if (!promoLink) return;
    navigator.clipboard.writeText(promoLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-bone p-6 md:p-12 max-w-4xl mx-auto space-y-8">
      <header className="border-b border-gold/20 pb-4 flex items-center justify-between">
        <div className="space-y-1">
          <Link to="/" className="text-xs text-gold hover:underline">
            ← 返回首页
          </Link>
          <h1 className="font-display text-3xl text-gold mt-1">掌柜 · 我的戏命铺</h1>
        </div>
        {details && (
          <div className="text-[10px] bg-gold/15 border border-gold/30 p-1 px-3 rounded-full text-gold font-medium">
            月令有效期至：
            {details.subscribedUntil
              ? new Date(details.subscribedUntil).toLocaleDateString()
              : "--"}
          </div>
        )}
      </header>

      {/* KPI Cards Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={<Compass className="text-gold" />}
          label="命铺访问量"
          value={stats?.invites ?? 0}
        />
        <KpiCard
          icon={<Users className="text-gold" />}
          label="绑定好友"
          value={stats?.conversions ?? 0}
        />
        <KpiCard
          icon={<Coins className="text-gold" />}
          label="总流水"
          value={`¥${((details?.totalPaidCents ?? 0) / 100).toFixed(2)}`}
        />
        <KpiCard
          icon={<Award className="text-gold" />}
          label="累计香火值"
          value={stats?.incense ?? 0}
          accent
        />
      </section>

      {/* Referral Link & Materials */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 glass p-6 rounded-2xl border border-gold/10 space-y-4">
          <h3 className="text-sm font-semibold text-gold flex items-center gap-2">
            <LinkIcon size={16} />
            专属推广归因链接
          </h3>
          <p className="text-xs text-muted-foreground">
            分享此链接到朋友圈或社群，所有点击进入并绑定微信的用户将自动计入您的测算网络。
          </p>

          <div className="flex gap-2">
            <div className="flex-1 bg-black/40 border border-gold/10 p-2.5 px-3 rounded-xl overflow-x-auto whitespace-nowrap scrollbar-thin text-xs text-gold font-mono">
              {promoLink}
            </div>
            <button
              onClick={handleCopyLink}
              className="h-10 px-4 rounded-xl ritual-btn text-xs font-semibold whitespace-nowrap flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <CheckCircle size={14} />
                  已复制
                </>
              ) : (
                "复制链接"
              )}
            </button>
          </div>
        </div>

        {/* Quick Marketing Copy */}
        <div className="glass p-6 rounded-2xl border border-gold/10 space-y-3">
          <h3 className="text-sm font-semibold text-gold flex items-center gap-2">
            <FileText size={16} />
            今日朋友圈素材
          </h3>
          <div className="bg-secondary/40 border border-gold/5 rounded-xl p-3.5 space-y-2 text-xs leading-relaxed text-muted-foreground select-all">
            <p>有些人不是不爱你，是你们俩命盘互相克嘴。</p>
            <p>想知道你们是正缘还是孽缘？扫码加我专属微信，戏命师在线帮你拆。</p>
          </div>
          <p className="text-[10px] text-muted-foreground/60 text-right">
            * 提示：发送「推广」给微信戏命师获取更多素材
          </p>
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl scroll-card p-5 border border-gold/5 flex flex-col justify-between h-28">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        {icon}
      </div>
      <div
        className={`font-display text-2xl mt-2 ${accent ? "text-gold text-shadow-gold" : "text-bone"}`}
      >
        {value}
      </div>
    </div>
  );
}
