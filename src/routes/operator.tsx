import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getOperatorStatus } from "@/lib/api/operator.functions";
import { Compass, Sparkles, Shield, Trophy, ChevronRight, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/operator")({
  component: OperatorLanding,
});

function OperatorLanding() {
  const navigate = useNavigate();
  const statusQuery = useQuery({
    queryKey: ["operator-status"],
    queryFn: () => getOperatorStatus(),
  });

  const active = statusQuery.data?.active ?? false;

  if (active) {
    navigate({ to: "/operator/dashboard" });
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-bone p-6 md:p-12 max-w-4xl mx-auto space-y-8 flex flex-col justify-center">
      <header className="border-b border-gold/20 pb-6 flex items-center justify-between">
        <div className="space-y-1">
          <Link to="/" className="text-xs text-gold hover:underline">
            ← 返回首页
          </Link>
          <h1 className="font-display text-3xl text-gold mt-1">开一间微信里的戏命铺</h1>
        </div>
        <div className="text-shadow-gold text-gold font-display text-2xl">
          ¥899 <span className="text-xs text-muted-foreground">/ 月</span>
        </div>
      </header>

      {/* Benefits Showcase */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass p-5 rounded-2xl border border-gold/10 space-y-2">
          <div className="flex items-center gap-2 text-gold">
            <Compass size={18} />
            <h3 className="font-display font-semibold text-sm">专属命铺链接</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            生成独立归因链接与推广海报。所有通过此链接进入绑定微信或产生付费的朋友，均自动永久归因于您的专属命铺下。
          </p>
        </div>

        <div className="glass p-5 rounded-2xl border border-gold/10 space-y-2">
          <div className="flex items-center gap-2 text-gold">
            <Sparkles size={18} />
            <h3 className="font-display font-semibold text-sm">专属朋友圈文案</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            微信机器人内开通「推广」特权。每日为您量身定制吸睛的朋友圈算命文案、故事钩子和对应配图链接，省去编写烦恼。
          </p>
        </div>

        <div className="glass p-5 rounded-2xl border border-gold/10 space-y-2">
          <div className="flex items-center gap-2 text-gold">
            <Shield size={18} />
            <h3 className="font-display font-semibold text-sm">铭文卡槽 +2 特权</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            开通后系统自动为您开启额外两个铭文装配位。您可以装配更多的财帛、贪狼、武曲铭文，使机器人测算回复更加生动多金。
          </p>
        </div>

        <div className="glass p-5 rounded-2xl border border-gold/10 space-y-2">
          <div className="flex items-center gap-2 text-gold">
            <Trophy size={18} />
            <h3 className="font-display font-semibold text-sm">香火值与平台活动奖励</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            所有好友的问命、盲盒、充值消费，都将转换为您的命铺「香火值」。参与每周及每月排名，获取专属的平台活动权益奖励。
          </p>
        </div>
      </section>

      {/* Compliance Box */}
      <section className="bg-secondary/40 border border-gold/10 rounded-2xl p-5 text-xs text-muted-foreground space-y-3">
        <div className="flex items-center gap-2 text-gold font-semibold">
          <HelpCircle size={14} />
          经营者须知 & 合规准则
        </div>
        <ul className="list-disc pl-5 space-y-1.5 leading-relaxed">
          <li>
            本产品提供虚拟命理内容生成及互动工具，所有分成奖励均为平台运营活动资格，
            <strong>不承诺保证任何现金收益或返利比例</strong>。
          </li>
          <li>
            严禁使用外挂、脚本进行恶意朋友圈私信群发骚扰。经营者推广请遵循合法、合理宣传方式。
          </li>
          <li>数字化虚拟商品一经支付激活，将无法办理无理由退款，请在购买前仔细阅读退款规则。</li>
        </ul>
      </section>

      {/* CTA Trigger */}
      <div className="flex flex-col items-center gap-3 pt-4">
        <Link
          to="/operator/pay"
          className="w-full md:w-80 h-12 rounded-xl ritual-btn text-sm font-semibold flex items-center justify-center gap-2 hover:scale-[1.01] transition-transform"
        >
          立即开通命铺经营者
          <ChevronRight size={16} />
        </Link>
        <p className="text-[10px] text-muted-foreground/60">
          开通即代表您同意本平台的《用户服务协议》与《退款规则》
        </p>
      </div>
    </div>
  );
}
