import { useState } from "react";
import { Modal } from "./Modal";
import { motion, AnimatePresence } from "framer-motion";
import { blindboxRates, marketItems, orderMock } from "@/lib/mock-data";
import type { ModalKey } from "@/lib/types";
import type { EarnApplication, ShareAsset } from "@/lib/domain";
import { MasterAvatar } from "./MasterAvatar";
import { AssetImage } from "./assets/AssetImage";
import type { AssetVariant } from "@/lib/assets/asset-types";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Check,
  Copy,
  Download,
  Flame,
  Crown,
} from "lucide-react";

/* ---------------- 充值 ---------------- */
export function TopupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const tiers = [
    { p: 5.99, label: "解封命盘", tag: "新人专享" },
    { p: 29.9, label: "盲盒折扣券", tag: "回血必备" },
    { p: 49.99, label: "月令订阅", tag: "热门" },
    { p: 99, label: "单抽盲盒", tag: "" },
    { p: 899, label: "戏命出马", tag: "高阶" },
  ];
  const [success, setSuccess] = useState<number | null>(null);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="供奉香火"
      subtitle="香火不足，天机不灵。模拟支付，不扣真钱。"
    >
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {tiers.map((t) => (
          <button
            key={t.p}
            onClick={() => setSuccess(t.p)}
            className="relative scroll-card rounded-xl p-3 text-left hover:border-gold transition group"
          >
            {t.tag && (
              <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded bg-gold/20 text-gold">
                {t.tag}
              </span>
            )}
            <div className="font-display text-xl text-gold text-shadow-gold">¥{t.p}</div>
            <div className="text-xs text-muted-foreground mt-1">{t.label}</div>
            <div className="mt-3 text-[10px] text-gold opacity-0 group-hover:opacity-100 transition">
              点击供奉 →
            </div>
          </button>
        ))}
        <div className="scroll-card rounded-xl p-3">
          <div className="text-xs text-muted-foreground mb-2">自定义金额</div>
          <input
            placeholder="¥"
            className="w-full bg-secondary/60 border border-gold/20 rounded-lg px-3 h-9 text-sm text-bone outline-none focus:border-gold/50 focus-visible:ring-1 focus-visible:ring-ring"
          />
          <button
            onClick={() => setSuccess(66)}
            className="w-full mt-2 h-8 rounded-lg ritual-btn text-xs"
          >
            叩拜供奉
          </button>
        </div>
      </div>

      <AnimatePresence>
        {success !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-6 relative scroll-card rounded-2xl p-5 text-center overflow-hidden"
          >
            {/* 燃烧符纸 emoji ember */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 12 }).map((_, i) => (
                <span
                  key={i}
                  className="absolute text-gold animate-ember"
                  style={{
                    left: `${(i * 8.3) % 100}%`,
                    bottom: 0,
                    animationDelay: `${i * 0.2}s`,
                    fontSize: 12 + (i % 3) * 4,
                  }}
                >
                  ✧
                </span>
              ))}
            </div>
            <div className="relative">
              <Check size={28} className="mx-auto text-gold" />
              <div className="mt-2 font-display text-lg text-gold-gradient">
                供奉成功 · ¥{success}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                气运 +{Math.round(success * 10)}，符纸已焚于香炉。
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}

/* ---------------- 订阅 ---------------- */
export function SubModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const plans = [
    {
      name: "命盘解封",
      was: 599,
      now: 5.99,
      period: "一次",
      perks: ["完整 HTML 命盘", "大运流年", "四化飞星", "三方四正"],
      color: "from-primary/40 to-primary/10",
    },
    {
      name: "趋吉避凶 · 月令契约",
      was: 1999,
      now: 49.99,
      period: "/月",
      hot: true,
      perks: ["每日流日 + 吉时提醒", "问事 3 次/日", "灵签随抽", "星象预警"],
      color: "from-accent/30 to-primary/30",
    },
    {
      name: "戏命出马 · 命铺契约",
      was: 12999,
      now: 899,
      period: "/月",
      perks: ["开通算命铺子", "自动接单 / 排盘", "自动报告生成", "模拟收益面板"],
      color: "from-destructive/20 to-accent/30",
    },
  ];
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="月令契约 · 三层漏斗"
      size="lg"
      subtitle="订阅后可解锁每日流日、吉时提醒和灵签。首版为模拟候补。"
    >
      <div className="grid md:grid-cols-3 gap-3">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`relative scroll-card rounded-2xl p-4 ${p.hot ? "border-gold/60 glow-gold" : ""}`}
          >
            {p.hot && (
              <span className="absolute -top-2 left-4 px-2 py-0.5 rounded-full text-[10px] bg-gold text-background font-semibold">
                最受欢迎
              </span>
            )}
            <div
              className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${p.color} opacity-30 pointer-events-none`}
            />
            <div className="relative">
              <h4 className="font-display text-base text-gold-gradient">{p.name}</h4>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xs text-muted-foreground line-through">¥{p.was}</span>
                <span className="font-display text-2xl text-gold text-shadow-gold">¥{p.now}</span>
                <span className="text-xs text-muted-foreground">{p.period}</span>
              </div>
              <ul className="mt-3 space-y-1.5 text-xs text-bone">
                {p.perks.map((pk) => (
                  <li key={pk} className="flex gap-2">
                    <span className="text-gold">✦</span>
                    {pk}
                  </li>
                ))}
              </ul>
              <button className="mt-4 w-full h-9 rounded-lg ritual-btn text-xs">加入候补</button>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] text-muted-foreground text-center">
        * 原型演示价格，模拟订阅状态。续费随时可断，命数不强求。
      </p>
    </Modal>
  );
}

/* ---------------- 盲盒 ---------------- */
export function BoxModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [phase, setPhase] = useState<"idle" | "spin" | "result">("idle");
  function pull() {
    setPhase("spin");
    setTimeout(() => setPhase("result"), 2200);
  }
  function reset() {
    setPhase("idle");
  }
  return (
    <Modal
      open={open}
      onClose={() => {
        onClose();
        reset();
      }}
      title="戏命师盲盒"
      subtitle="天枢、地璇、人玑、混沌——谁愿意替你改命。"
    >
      {phase === "idle" && (
        <>
          <div className="relative h-56 grid place-items-center rounded-2xl scroll-card overflow-hidden mb-4">
            <div className="absolute inset-0 rune-pattern opacity-60" />
            <div className="relative animate-breath">
              <AssetImage
                assetId="blind_box.box.standard"
                variant="box"
                alt="戏命师盲盒"
                className="h-36 w-36 object-contain"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {blindboxRates.map((r) => (
              <div
                key={r.tier}
                className="scroll-card rounded-xl p-2 text-center"
                style={{ borderColor: `var(--color-${r.color})` }}
              >
                <div className="font-display text-sm" style={{ color: `var(--color-${r.color})` }}>
                  {r.tier}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">{r.desc}</div>
                <div className="text-[11px] text-bone mt-1">{r.rate}%</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={pull} className="flex-1 h-11 rounded-xl ritual-btn">
              单抽 ¥99
            </button>
            <button
              onClick={pull}
              className="flex-1 h-11 rounded-xl bg-secondary/70 border border-gold/30 text-gold font-semibold"
            >
              十连 ¥888
            </button>
          </div>
        </>
      )}
      {phase === "spin" && <OpeningSequence />}
      {phase === "result" && (
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center py-2"
        >
          <div
            className="mx-auto w-64 rounded-2xl p-5 scroll-card relative overflow-hidden"
            style={{ borderColor: "var(--rare-purple)" }}
          >
            <AssetImage
              assetId="blind_box.result.dixuan"
              variant="mobile"
              alt="地璇抽中结果背景"
              priority
              className="absolute inset-0 h-full w-full object-cover opacity-30"
            />
            <span
              className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-display"
              style={{ background: "var(--rare-purple)", color: "white" }}
            >
              紫色史诗 · 地璇
            </span>
            <AssetImage
              assetId="master.dixuan.01"
              variant="card"
              priority
              alt="地璇命师 · 合婚画司"
              className="relative z-10 mx-auto w-36 rounded-xl border border-gold/25 object-cover shadow-2xl"
            />
            <h4 className="relative z-10 mt-2 font-display text-xl text-gold-gradient">
              地璇命师 · 合婚画司
            </h4>
            <p className="relative z-10 text-[11px] text-muted-foreground mt-1">
              专精：合婚 · 风水择日
            </p>
            <div className="relative z-10 mt-3 text-xs text-bone">
              参考价 <span className="text-gold font-display">¥1,288</span>
            </div>
          </div>
          <div className="mt-4 flex gap-2 justify-center">
            <button
              onClick={reset}
              className="px-4 h-9 rounded-lg bg-secondary/70 border border-gold/20 text-bone text-xs"
            >
              再抽一次
            </button>
            <button className="px-4 h-9 rounded-lg ritual-btn text-xs">收藏命师</button>
          </div>
        </motion.div>
      )}
    </Modal>
  );
}

function OpeningSequence() {
  const frames = [
    "blind_box.frame.01",
    "blind_box.frame.02",
    "blind_box.frame.03",
    "blind_box.frame.04",
    "blind_box.frame.05",
    "blind_box.frame.06",
  ];

  return (
    <div className="h-72 grid place-items-center relative">
      <motion.div
        animate={{ rotate: 720 }}
        transition={{ duration: 2.2, ease: [0.4, 0, 0.2, 1] }}
        className="relative h-48 w-48 rounded-full border-4 border-dashed border-gold/70 glow-gold grid place-items-center overflow-hidden"
      >
        {frames.map((assetId, index) => (
          <motion.div
            key={assetId}
            className="absolute inset-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ delay: index * 0.32, duration: 0.48, repeat: 0 }}
          >
            <AssetImage
              assetId={assetId}
              variant="frame"
              alt={`开盒序列帧 ${index + 1}`}
              className="h-full w-full rounded-full object-cover"
            />
          </motion.div>
        ))}
        <div className="absolute inset-8 rounded-full border border-accent/60" />
      </motion.div>
      <div className="absolute bottom-4 text-xs text-muted-foreground animate-pulse">
        天机推演中……符纸已焚
      </div>
    </div>
  );
}

/* ---------------- 市场 ---------------- */
export function MarketDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<"master" | "rune" | "ask" | "mine">("master");
  const tabs: Array<{ k: "master" | "rune" | "ask" | "mine"; t: string }> = [
    { k: "master", t: "戏命师" },
    { k: "rune", t: "铭文" },
    { k: "ask", t: "求购" },
    { k: "mine", t: "我的挂售" },
  ];
  const list = marketItems.filter((m) =>
    tab === "master" ? m.kind === "master" : tab === "rune" ? m.kind === "rune" : false,
  );
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="命师交易所"
      subtitle="买卖命师，流通气运。今日总成交 ¥128,440"
      side="right"
    >
      <div className="flex gap-1 mb-4 p-1 rounded-xl bg-secondary/60">
        {tabs.map((x) => (
          <button
            key={x.k}
            onClick={() => setTab(x.k)}
            className={`flex-1 h-8 rounded-lg text-xs transition ${
              tab === x.k
                ? "bg-gradient-to-br from-primary to-accent/60 text-background font-semibold"
                : "text-muted-foreground"
            }`}
          >
            {x.t}
          </button>
        ))}
      </div>

      {(tab === "master" || tab === "rune") && (
        <div className="space-y-3">
          {list.map((m) => (
            <div key={m.id} className="scroll-card rounded-xl p-3 flex items-center gap-3">
              <div
                className="h-14 w-14 rounded-xl grid place-items-center shrink-0 overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, var(--color-${m.color}) 0%, oklch(0.2 0.05 295) 100%)`,
                }}
              >
                <AssetImage
                  assetId={m.assetId}
                  variant={m.thumbVariant as AssetVariant}
                  alt={m.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-bone truncate">{m.name}</span>
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: `var(--color-${m.color})` }}>
                  {m.tier}
                </div>
                <div className="text-[10px] text-muted-foreground truncate">{m.spec}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-display text-gold text-shadow-gold">
                  ¥{m.price.toLocaleString()}
                </div>
                <div
                  className={`text-[11px] flex items-center gap-0.5 justify-end ${m.change >= 0 ? "text-emerald-400" : "text-destructive"}`}
                >
                  {m.change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {m.change > 0 ? "+" : ""}
                  {m.change}%
                </div>
                <button className="mt-1 h-7 px-3 rounded-lg ritual-btn text-[11px]">
                  模拟购买
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "ask" && (
        <EmptyState text="还没有求购单，发一条让全网道友替你找。" actionText="发布求购" />
      )}
      {tab === "mine" && (
        <EmptyState text="你的命师还在养，没东西可挂。先抽一只罢。" actionText="去抽盲盒" />
      )}
    </Modal>
  );
}

function EmptyState({ text, actionText }: { text: string; actionText: string }) {
  return (
    <div className="text-center py-12">
      <div className="text-5xl mb-3 opacity-60">🪷</div>
      <p className="text-sm text-muted-foreground">{text}</p>
      <button className="mt-4 h-9 px-4 rounded-lg ritual-btn text-xs">{actionText}</button>
    </div>
  );
}

/* ---------------- 出马赚钱 ---------------- */
export function EarnDrawer({
  open,
  onClose,
  onApply,
  isApplying,
  application,
}: {
  open: boolean;
  onClose: () => void;
  onApply: (input: { offer: string; audience: string; priceRange: string }) => void;
  isApplying: boolean;
  application: EarnApplication | null;
}) {
  const [offer, setOffer] = useState("测算方案设计：事业发展与决策报告");
  const [audience, setAudience] = useState("适合面临职业转型与项目决策的求测者");
  const [priceRange, setPriceRange] = useState("30-99 (建议点数)");
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="戏命出马 · 咨询菜单设计"
      subtitle="由戏命师为你生成专属的命理咨询服务菜单与报告草稿。"
      side="right"
    >
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Kpi label="今日咨询案例" value="12 份" />
        <Kpi label="预计生成报告" value="12 份" accent />
        <Kpi label="模型消耗" value="18k tokens" />
        <Kpi label="服务匹配度" value="98%" accent />
        <Kpi label="专业匹配" value="88%" />
        <Kpi label="生成质量" value="4.9★" />
      </div>

      <div className="rounded-xl glass p-3 mb-4">
        <div className="text-xs text-muted-foreground mb-2">本周报告生成趋势</div>
        <div className="flex items-end gap-1.5 h-20">
          {[40, 65, 50, 80, 90, 70, 95].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-md bg-gradient-to-t from-primary to-accent"
              style={{ height: `${h}%`, opacity: 0.4 + i * 0.08 }}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
          {["一", "二", "三", "四", "五", "六", "日"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
      </div>

      <h4 className="text-xs font-semibold text-gold mb-2">近期生成记录</h4>
      <div className="space-y-2 mb-4">
        {orderMock.map((o) => (
          <div
            key={o.id}
            className="rounded-xl bg-secondary/40 border border-border p-3 flex items-center gap-3"
          >
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-xs font-display text-background">
              {o.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-bone">
                {o.name} · {o.type}
              </div>
              <div className="text-[11px] text-muted-foreground">报告号 #{1000 + o.id}</div>
            </div>
            <div className="text-right">
              <div className="font-display text-gold">{o.price} 点</div>
              <div
                className={`text-[10px] ${o.status === "已完成" ? "text-emerald-400" : o.status === "生成中" ? "text-accent" : "text-destructive"}`}
              >
                {o.status}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl glass p-3 mb-4">
        <div className="text-xs font-semibold text-gold mb-2">服务菜单参数设计</div>
        {application ? (
          <p className="text-xs text-bone leading-relaxed">
            方案已就绪：{application.offer} · {application.audience} · 建议点数：
            {application.priceRange}
          </p>
        ) : (
          <div className="space-y-2">
            <input
              value={offer}
              onChange={(e) => setOffer(e.target.value)}
              className="w-full h-9 px-3 rounded-lg bg-secondary/60 border border-gold/20 text-xs text-bone outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full h-9 px-3 rounded-lg bg-secondary/60 border border-gold/20 text-xs text-bone outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <input
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="w-full h-9 px-3 rounded-lg bg-secondary/60 border border-gold/20 text-xs text-bone outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onApply({ offer, audience, priceRange })}
          disabled={isApplying || Boolean(application)}
          className="h-10 rounded-xl ritual-btn text-xs disabled:opacity-60"
        >
          {application ? "方案已就绪" : isApplying ? "推演中" : "生成菜单与报告方案"}
        </button>
        <button className="h-10 rounded-xl bg-secondary/70 border border-gold/30 text-gold text-xs">
          生成咨询海报
        </button>
        <button className="h-10 rounded-xl bg-secondary/70 border border-gold/20 text-bone text-xs">
          设置服务价格
        </button>
        <button className="h-10 rounded-xl bg-secondary/70 border border-gold/20 text-bone text-xs">
          查看客户报告
        </button>
      </div>
    </Modal>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl scroll-card p-3">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div
        className={`font-display text-lg mt-1 ${accent ? "text-gold text-shadow-gold" : "text-bone"}`}
      >
        {value}
      </div>
    </div>
  );
}

/* ---------------- 分享卡 ---------------- */
export function ShareModal({
  open,
  onClose,
  shareAsset,
  onGenerate,
  isGenerating,
}: {
  open: boolean;
  onClose: () => void;
  shareAsset: ShareAsset | null;
  onGenerate: (kind: "seal" | "daily" | "earn") => void;
  isGenerating: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="分享卡 · 卷轴"
      subtitle="把你的命数贴上朋友圈。"
      size="md"
    >
      <div className="mx-auto w-full max-w-[20rem] aspect-[3/4] rounded-2xl scroll-card relative overflow-hidden p-5 flex flex-col">
        <AssetImage
          assetId="share.seal"
          variant="mobile"
          alt="命盘分享卡背景"
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 rune-pattern opacity-30" />
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-primary/30 blur-3xl" />
        <div className="relative text-center">
          <p className="font-display text-sm text-gold tracking-widest">戏 命 师</p>
          <p className="text-[10px] text-muted-foreground mt-1">执笔写命 · 嘲讽人生剧本</p>
        </div>
        <div className="relative flex-1 grid place-items-center">
          <MasterAvatar size={140} />
        </div>
        <div className="relative text-center">
          <p className="text-sm text-bone leading-relaxed">
            我今日命盘已开 <span className="font-display text-gold text-xl">30%</span>，
          </p>
          <p className="text-sm text-bone">剩下 70% 需要三位道友助力。</p>
          <div className="mt-3 flex items-end justify-between">
            <div className="text-left">
              <p className="text-[10px] text-muted-foreground">扫码助我</p>
              <p className="text-[10px] text-muted-foreground">— 小天命</p>
            </div>
            <div className="h-14 w-14 rounded-lg bg-bone grid place-items-center">
              <div className="grid grid-cols-5 gap-px">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-1.5 ${Math.random() > 0.5 ? "bg-background" : "bg-bone"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {shareAsset && (
        <div className="mt-4 rounded-xl glass p-3">
          <p className="text-xs text-bone leading-relaxed">{shareAsset.copy}</p>
          <a
            href={shareAsset.url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex text-xs text-gold hover:underline"
          >
            打开已生成分享卡
          </a>
        </div>
      )}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <button
          onClick={() => onGenerate("seal")}
          disabled={isGenerating}
          className="h-10 rounded-lg ritual-btn text-xs flex items-center justify-center gap-1 disabled:opacity-60"
        >
          <Download size={12} /> 命盘卡
        </button>
        <button
          onClick={() => onGenerate("daily")}
          disabled={isGenerating}
          className="h-10 rounded-lg bg-secondary/70 border border-gold/30 text-gold text-xs flex items-center justify-center gap-1 disabled:opacity-60"
        >
          <Copy size={12} /> 流日卡
        </button>
        <button
          onClick={() => onGenerate("earn")}
          disabled={isGenerating}
          className="h-10 rounded-lg bg-secondary/70 border border-gold/20 text-bone text-xs disabled:opacity-60"
        >
          出马卡
        </button>
      </div>
    </Modal>
  );
}

/* ---------------- 每日问安弹窗 ---------------- */
export function GreetModal({
  open,
  onClose,
  streak,
  alreadyChecked,
}: {
  open: boolean;
  onClose: () => void;
  streak: number;
  alreadyChecked: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="每日问安 · 连续第 7 日"
      subtitle="戏命师瞥了你一眼，勉强抬手。"
      size="sm"
    >
      <div className="text-center py-2">
        <Crown size={28} className="mx-auto text-gold animate-twinkle" />
        <p className="mt-3 font-display text-lg text-gold-gradient">连续问安 {streak} 日</p>
        <p className="text-xs text-muted-foreground mt-1">
          {alreadyChecked
            ? "今日已经问安，别装刚来。"
            : "恭喜解锁今日气运，断签清零的刀暂时没落下。"}
        </p>
        <div className="my-4 mx-auto w-28 h-36 rounded-lg scroll-card grid place-items-center text-4xl">
          📜
        </div>
        <p className="text-xs text-bone">
          {alreadyChecked ? "今日奖励已领取" : "+ 10 气运　+ 命盘亮度"}
        </p>
        <button onClick={onClose} className="mt-4 h-10 px-6 rounded-xl ritual-btn text-sm">
          领受问安
        </button>
      </div>
    </Modal>
  );
}

/* ---------------- 解封支付 ---------------- */
export function SealModal({
  open,
  onClose,
  onPaid,
}: {
  open: boolean;
  onClose: () => void;
  onPaid: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="解封命盘"
      subtitle="第一版暂不真实收款，先验证转化意愿。"
      size="sm"
    >
      <div className="text-center py-4">
        <Flame size={28} className="mx-auto text-gold animate-twinkle" />
        <p className="mt-3 text-sm text-bone">命盘剩余 70% 原价 ¥599，首版模拟 ¥5.99 解封</p>
        <p className="text-[11px] text-muted-foreground mt-1">
          含：大运流年 · 四化飞星 · 三方四正 · 命主身主
        </p>
        <div className="mt-5 flex gap-2 justify-center">
          <button
            onClick={onClose}
            className="px-5 h-10 rounded-xl bg-secondary/70 border border-gold/20 text-bone text-sm"
          >
            稍后再说
          </button>
          <button
            onClick={() => {
              onPaid();
              onClose();
            }}
            className="px-5 h-10 rounded-xl ritual-btn text-sm"
          >
            模拟解封
          </button>
        </div>
      </div>
    </Modal>
  );
}
