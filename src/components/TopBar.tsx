import { Bell, Crown, Flame, Menu, Sparkles, Wallet } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { ModalKey } from "@/lib/types";

export function TopBar({
  user,
  onOpen,
  onToggleSidebar,
}: {
  user: {
    level: string;
    asksToday: number;
    asksMax: number;
    qiyun: number;
    wallet: number;
    unread: number;
    subscribed?: boolean;
    subscribedUntil?: string | null;
  };
  onOpen: Dispatch<SetStateAction<ModalKey | null>>;
  onToggleSidebar: () => void;
}) {
  return (
    <header className="relative z-30 h-14 md:h-16 px-3 md:px-6 flex items-center justify-between glass-strong border-b border-gold/14">
      <div className="flex items-center gap-3 md:gap-4 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="md:hidden h-9 w-9 grid place-items-center rounded-lg bg-secondary/50 text-gold border border-gold/15"
          aria-label="菜单"
        >
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <div className="relative h-9 w-9 grid place-items-center rounded-xl bg-gradient-to-br from-primary/75 to-accent shadow-lg">
            <span className="font-display text-lg text-background">戲</span>
          </div>
          <div className="leading-tight min-w-0">
            <h1 className="font-display text-base md:text-lg text-gold-gradient truncate">
              戏命师
            </h1>
            <p className="hidden sm:block text-[10px] md:text-xs text-muted-foreground truncate">
              执笔写命 · 嘲讽人生剧本
            </p>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-2 text-xs">
        <Stat icon={<Crown size={14} />} label="等级" value={user.level} />
        <Stat
          icon={<Sparkles size={14} />}
          label="今日问事"
          value={`${user.asksToday}/${user.asksMax}`}
        />
        <Stat icon={<Flame size={14} />} label="气运" value={user.qiyun.toLocaleString()} accent />
        <Stat icon={<Wallet size={14} />} label="香火钱" value={`¥${user.wallet}`} />
      </div>

      <div className="flex items-center gap-1.5 md:gap-2">
        <button
          onClick={() => onOpen("topup")}
          className="hidden sm:inline-flex h-9 px-3 rounded-lg text-xs font-medium glass border border-gold/20 text-gold hover:bg-gold/10 transition items-center gap-1.5"
        >
          <Wallet size={14} /> 充值
        </button>
        <button
          onClick={() => onOpen("sub")}
          className="h-9 px-3 md:px-4 rounded-lg text-xs font-semibold ritual-btn"
        >
          {user.subscribed ? "契约中" : "订阅"}
        </button>
        <button
          aria-label="通知"
          className="relative h-9 w-9 grid place-items-center rounded-lg bg-secondary/50 text-bone border border-gold/10"
        >
          <Bell size={16} />
          {user.unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold grid place-items-center bg-destructive text-destructive-foreground">
              {user.unread}
            </span>
          )}
        </button>
        <div className="h-9 w-9 rounded-lg bg-secondary/65 grid place-items-center font-display text-sm text-gold border border-gold/24">
          天
        </div>
      </div>
    </header>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 px-3 h-9 rounded-lg bg-secondary/24 border border-gold/10">
      <span className={accent ? "text-gold" : "text-muted-foreground"}>{icon}</span>
      <span className="text-muted-foreground">{label}</span>
      <span className={accent ? "font-semibold text-gold" : "font-semibold text-bone"}>
        {value}
      </span>
    </div>
  );
}
