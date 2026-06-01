import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getOperatorStatus, getOperatorDetails } from "@/lib/api/operator.functions";
import {
  Compass,
  Users,
  Coins,
  Award,
  Link as LinkIcon,
  FileText,
  CheckCircle,
  ShieldAlert,
  History,
  ShoppingBag,
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

  const detailsQuery = useQuery({
    queryKey: ["operator-details"],
    queryFn: () => getOperatorDetails(),
  });

  const status = statusQuery.data;
  const details = detailsQuery.data;

  if (statusQuery.isSuccess && !status?.active) {
    navigate({ to: "/operator" });
    return null;
  }

  const referralCode = details?.referralCode ?? "";
  const promoLink = referralCode ? `${window.location.origin}/s/${referralCode}` : "";

  const handleCopyLink = () => {
    if (!promoLink) return;
    navigator.clipboard.writeText(promoLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-bone p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <header className="border-b border-gold/20 pb-4 flex items-center justify-between">
        <div className="space-y-1">
          <Link to="/" className="text-xs text-gold hover:underline">
            ← 返回首页
          </Link>
          <h1 className="font-display text-2xl md:text-3xl text-gold mt-1">掌柜 · 我的戏命铺</h1>
        </div>
        {details && (
          <div className="flex flex-col items-end gap-1">
            <div className="text-[10px] bg-gold/15 border border-gold/30 px-3 py-1 rounded-full text-gold font-medium">
              有效期至：
              {details.subscribedUntil
                ? new Date(details.subscribedUntil).toLocaleDateString()
                : "--"}
            </div>
            <div className="text-[10px] text-muted-foreground">
              风险状态：
              <span
                className={
                  details.riskStatus === "normal" ? "text-emerald-400" : "text-destructive"
                }
              >
                {details.riskStatus === "normal" ? "正常" : details.riskStatus}
              </span>
            </div>
          </div>
        )}
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          icon={<Compass className="text-gold" size={16} />}
          label="命铺访问量"
          value={details?.totalInvites ?? 0}
        />
        <KpiCard
          icon={<Users className="text-gold" size={16} />}
          label="转化好友"
          value={details?.totalConversions ?? 0}
        />
        <KpiCard
          icon={<Coins className="text-gold" size={16} />}
          label="总流水"
          value={`¥${((details?.totalPaidCents ?? 0) / 100).toFixed(2)}`}
        />
        <KpiCard
          icon={<Award className="text-gold" size={16} />}
          label="累计香火值"
          value={details?.incenseValue ?? 0}
          accent
        />
      </section>

      {/* Referral Link */}
      <section className="bg-secondary/20 border border-gold/10 rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gold flex items-center gap-2">
          <LinkIcon size={16} />
          专属推广链接
        </h3>
        <div className="flex gap-2">
          <div className="flex-1 bg-black/40 border border-gold/10 p-2.5 px-3 rounded-xl overflow-x-auto whitespace-nowrap text-xs text-gold font-mono">
            {promoLink}
          </div>
          <button
            onClick={handleCopyLink}
            className="h-10 px-4 rounded-xl ritual-btn text-xs font-semibold whitespace-nowrap flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <CheckCircle size={14} /> 已复制
              </>
            ) : (
              "复制链接"
            )}
          </button>
        </div>
      </section>

      {/* Marketing Copy */}
      <section className="bg-secondary/20 border border-gold/10 rounded-2xl p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gold flex items-center gap-2">
          <FileText size={16} />
          今日朋友圈文案
        </h3>
        <div className="bg-black/30 border border-gold/5 rounded-xl p-3.5 text-xs leading-relaxed text-muted-foreground select-all">
          <p>有些人不是不爱你，是你们俩命盘互相克嘴。</p>
          <p>想知道你们是正缘还是孽缘？扫码加我专属微信，戏命师在线帮你拆。</p>
        </div>
        <p className="text-[10px] text-muted-foreground/60 text-right">
          微信发送「推广」给戏命师获取更多素材
        </p>
      </section>

      {/* Recent Activity */}
      {details && (
        <section className="bg-secondary/20 border border-gold/10 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gold flex items-center gap-2">
            <History size={16} />
            最近活动
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between bg-black/20 rounded-lg p-3">
              <span className="text-muted-foreground">命铺访问次数</span>
              <span className="text-bone font-semibold">{details.totalInvites}</span>
            </div>
            <div className="flex justify-between bg-black/20 rounded-lg p-3">
              <span className="text-muted-foreground">成功转化</span>
              <span className="text-bone font-semibold">{details.totalConversions}</span>
            </div>
            <div className="flex justify-between bg-black/20 rounded-lg p-3">
              <span className="text-muted-foreground">总流水</span>
              <span className="text-gold font-semibold">
                ¥{((details.totalPaidCents ?? 0) / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between bg-black/20 rounded-lg p-3">
              <span className="text-muted-foreground">香火值</span>
              <span className="text-gold font-semibold">{details.incenseValue}</span>
            </div>
          </div>
        </section>
      )}

      {/* Compliance */}
      <section className="bg-black/20 border border-gold/5 rounded-2xl p-4 text-xs text-muted-foreground">
        <p className="flex items-center gap-1.5 text-gold font-semibold mb-2">
          <ShieldAlert size={14} />
          合规说明
        </p>
        <p>
          活动归因期内，好友通过你的专属链接产生的互动和消费，会计入你的命铺香火值。
          香火值可参与平台活动权益兑换，平台不承诺任何固定现金收益。
        </p>
      </section>

      {/* CTA: Send to Bot */}
      <div className="text-center">
        <p className="text-[10px] text-muted-foreground">
          在微信中向戏命师发送「推广」获取每日文案和配图
        </p>
      </div>
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
    <div className="rounded-2xl bg-secondary/20 border border-gold/5 p-4 flex flex-col justify-between h-24">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        {icon}
      </div>
      <div
        className={`font-display text-xl mt-1 ${accent ? "text-gold text-shadow-gold" : "text-bone"}`}
      >
        {value}
      </div>
    </div>
  );
}
