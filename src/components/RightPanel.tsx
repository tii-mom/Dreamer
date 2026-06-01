import { MasterAvatar } from "./MasterAvatar";
import { masterMock } from "@/lib/mock-data";
import type { ModalKey } from "@/lib/types";
import { Check, Clock, Sparkles } from "lucide-react";

export function RightPanel({ onOpenModal }: { onOpenModal: (k: ModalKey) => void }) {
  return (
    <aside className="hidden xl:flex w-[22rem] shrink-0 flex-col gap-4 p-4 overflow-y-auto scrollbar-thin h-[calc(100vh-4rem)] bg-background/12 border-l border-gold/8">
      {/* Master card */}
      <div className="rounded-2xl scroll-card p-4 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/18 blur-3xl" />
        <div className="absolute inset-0 rune-pattern opacity-50" />
        <div className="relative flex items-start gap-4">
          <div className="shrink-0">
            <MasterAvatar size={72} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-base text-gold-gradient truncate">
              {masterMock.name}
            </h3>
            <div className="mt-1 flex items-center gap-2 text-[11px]">
              <span className="px-2 py-0.5 rounded-md bg-gold/10 border border-gold/24 text-gold">
                {masterMock.level}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-secondary/30 text-muted-foreground">
                {masterMock.grade}品阶
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground truncate">
              {masterMock.specialty.join(" / ")}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
          <MiniStat
            label="好感度"
            value={`${masterMock.affinity}/100`}
            bar={masterMock.affinity}
            barColor="from-primary to-accent"
          />
          <MiniStat label="今日额度" value={`1 / 3`} bar={33} barColor="from-gold/60 to-gold/30" />
          <MiniStat
            label="铭文槽"
            value={`${masterMock.runeSlots.used} / ${masterMock.runeSlots.max}`}
            sub={masterMock.currentRune}
          />
          <MiniStat label="可交易" value={masterMock.tradable ? "是" : "否"} />
        </div>

        <div className="mt-3 grid grid-cols-4 gap-1.5 w-full text-[11px]">
          {[
            { label: "换装", modal: null },
            { label: "升级", modal: null },
            { label: "装铭文", modal: null },
            { label: "估价", modal: "market" as ModalKey },
          ].map(({ label, modal }) =>
            modal ? (
              <button
                key={label}
                onClick={() => onOpenModal(modal)}
                className="h-8 rounded-lg ritual-btn text-xs"
              >
                {label}
              </button>
            ) : (
              <div
                key={label}
                className="h-8 rounded-lg bg-secondary/20 border border-gold/8 flex items-center justify-center text-muted-foreground/40 cursor-default"
              >
                {label}
              </div>
            ),
          )}
        </div>
      </div>

      {/* Today tasks */}
      <div className="rounded-2xl bg-secondary/18 border border-gold/14 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-display text-sm text-gold-gradient">今日任务</h4>
          <span className="text-[10px] text-muted-foreground">2 / 5</span>
        </div>
        <ul className="space-y-2">
          <Task done text="向戏命师问安" reward="+10 气运" />
          <Task done text="查看今日流日" reward="+10 气运" />
          <Task text="完成一次问事" />
          <Task text="生成分享卡" cta="生成" />
          <Task text="邀请一位好友助力" />
        </ul>
      </div>

      {/* Limited event */}
      <div className="rounded-2xl p-4 scroll-card relative overflow-hidden">
        <div className="relative">
          <div className="flex items-center gap-2 text-xs text-amber/80 font-semibold">
            <Clock size={12} /> 限时事件
          </div>
          <p className="mt-2 text-sm font-display text-gold-gradient">今日 23:17 火星入命宫</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            24 小时内查看，否则星象散去，吉凶不再可推。
          </p>
          <button
            onClick={() => onOpenModal("share")}
            className="mt-3 w-full h-9 rounded-lg ritual-btn text-xs flex items-center justify-center gap-1.5"
          >
            <Sparkles size={12} /> 立即查看
          </button>
        </div>
      </div>
    </aside>
  );
}

function MiniStat({
  label,
  value,
  bar,
  barColor,
  sub,
}: {
  label: string;
  value: string;
  bar?: number;
  barColor?: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg bg-secondary/40 border border-gold/10 p-2.5">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-sm font-display text-bone mt-0.5">{value}</div>
      {bar !== undefined && (
        <div className="mt-1.5 h-1 rounded-full bg-secondary/60 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${barColor ?? "from-gold/60 to-gold/30"}`}
            style={{ width: `${Math.min(bar, 100)}%` }}
          />
        </div>
      )}
      {sub && <div className="mt-0.5 text-[10px] text-muted-foreground truncate">{sub}</div>}
    </div>
  );
}

function Task({
  text,
  done,
  reward,
  cta,
}: {
  text: string;
  done?: boolean;
  reward?: string;
  cta?: string;
}) {
  return (
    <li className="flex items-center gap-2 text-xs">
      <span
        className={`h-5 w-5 grid place-items-center rounded-md border shrink-0 ${
          done
            ? "border-gold bg-gold/20 text-gold"
            : "border-border bg-secondary/40 text-muted-foreground"
        }`}
      >
        {done ? <Check size={12} /> : <span className="text-muted-foreground/60">✦</span>}
      </span>
      <span className={done ? "text-muted-foreground line-through" : "text-bone"}>{text}</span>
      {done && reward && <span className="ml-auto text-[10px] text-gold shrink-0">{reward}</span>}
      {!done && cta && <span className="ml-auto text-[10px] text-gold/60 shrink-0">{cta}</span>}
    </li>
  );
}
