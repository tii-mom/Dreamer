import { MasterAvatar } from "./MasterAvatar";
import { masterMock } from "@/lib/mock-data";
import type { ModalKey } from "@/lib/types";
import { Check, Clock, Sparkles } from "lucide-react";

export function RightPanel({ onOpenModal }: { onOpenModal: (k: ModalKey) => void }) {
  return (
    <aside className="hidden xl:flex w-[22rem] shrink-0 flex-col gap-4 p-4 overflow-y-auto scrollbar-thin h-[calc(100vh-4rem)]">
      {/* Master card */}
      <div className="rounded-2xl scroll-card p-5 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute inset-0 rune-pattern opacity-50" />
        <div className="relative flex flex-col items-center text-center">
          <MasterAvatar size={140} />
          <h3 className="mt-3 font-display text-lg text-gold-gradient">{masterMock.name}</h3>
          <div className="mt-1 flex items-center gap-2 text-[11px]">
            <span className="px-2 py-0.5 rounded bg-secondary/70 border border-gold/30 text-gold">
              {masterMock.level}
            </span>
            <span className="px-2 py-0.5 rounded bg-secondary/40 text-muted-foreground">
              {masterMock.grade}品阶
            </span>
          </div>

          <div className="mt-4 w-full space-y-2">
            <Row label="专精" value={masterMock.specialty.join(" / ")} />
            <Row label="好感度" value={`${masterMock.affinity}/100`}>
              <div className="mt-1 h-1.5 rounded-full bg-secondary/70 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: `${masterMock.affinity}%` }} />
              </div>
            </Row>
            <Row label="今日额度" value={`1 / 3`} />
            <Row label="铭文槽" value={`${masterMock.runeSlots.used} / ${masterMock.runeSlots.max} · ${masterMock.currentRune}`} />
            <Row label="可交易" value={masterMock.tradable ? "是" : "否"} />
          </div>

          <div className="mt-4 grid grid-cols-4 gap-1.5 w-full text-[11px]">
            {["换装", "升级", "装铭文", "估价"].map((t, i) => (
              <button
                key={t}
                onClick={() => i === 3 && onOpenModal("market")}
                className="h-9 rounded-lg glass border border-gold/20 text-bone hover:text-gold hover:border-gold/50 transition"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Today tasks */}
      <div className="rounded-2xl glass-strong p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-display text-sm text-gold-gradient">今日任务</h4>
          <span className="text-[10px] text-muted-foreground">2 / 5</span>
        </div>
        <ul className="space-y-2">
          <Task done text="向戏命师问安" />
          <Task done text="查看今日流日" />
          <Task text="完成一次问事" />
          <Task text="生成分享卡" />
          <Task text="邀请一位好友助力" />
        </ul>
      </div>

      {/* Limited event */}
      <div className="rounded-2xl p-4 talisman-border bg-card/70 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 via-transparent to-accent/10" />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs text-destructive font-semibold">
            <Clock size={12} /> 限时事件
          </div>
          <p className="mt-2 text-sm font-display text-gold-gradient text-shadow-gold">
            今日 23:17　火星入命宫
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            24 小时内查看，否则星象散去，吉凶不再可推。
          </p>
          <button onClick={() => onOpenModal("share")} className="mt-3 w-full h-9 rounded-lg ritual-btn text-xs flex items-center justify-center gap-1.5">
            <Sparkles size={12} /> 立即查看
          </button>
        </div>
      </div>
    </aside>
  );
}

function Row({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="text-left">
      <div className="flex justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-bone">{value}</span>
      </div>
      {children}
    </div>
  );
}

function Task({ text, done }: { text: string; done?: boolean }) {
  return (
    <li className="flex items-center gap-2 text-xs">
      <span
        className={`h-5 w-5 grid place-items-center rounded-md border ${
          done ? "border-gold bg-gold/20 text-gold" : "border-border bg-secondary/40 text-muted-foreground"
        }`}
      >
        {done ? <Check size={12} /> : "✦"}
      </span>
      <span className={done ? "text-muted-foreground line-through" : "text-bone"}>{text}</span>
      {done && <span className="ml-auto text-[10px] text-gold animate-twinkle">+10 气运</span>}
    </li>
  );
}
