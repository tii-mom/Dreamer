import { sidebarItems } from "@/lib/mock-data";
import type { ModalKey } from "@/lib/types";
import { useState } from "react";
import type { ReactNode } from "react";
import {
  ChevronDown,
  Coins,
  Compass,
  Handshake,
  Lock,
  MessageCircle,
  ScrollText,
  Settings,
  ShoppingBag,
  Sparkles,
  Store,
  SunMedium,
  Sword,
  X,
} from "lucide-react";

const itemToModal: Record<string, ModalKey | undefined> = {
  sub: "sub",
  topup: "topup",
  box: "box",
  market: "market",
  earn: "earn",
  greet: "greet",
  chart: "seal",
};

const connectedKeys = new Set(Object.keys(itemToModal));

const itemIcons: Record<string, ReactNode> = {
  chat: <MessageCircle size={17} />,
  greet: <Sparkles size={17} />,
  daily: <SunMedium size={17} />,
  chart: <Compass size={17} />,
  box: <ShoppingBag size={17} />,
  market: <Store size={17} />,
  rune: <ScrollText size={17} />,
  sub: <Lock size={17} />,
  topup: <Coins size={17} />,
  earn: <Sword size={17} />,
  income: <Coins size={17} />,
  friends: <Handshake size={17} />,
  settings: <Settings size={17} />,
};

const groupOrder = ["core", "assets", "growth", "settings"] as const;
type GroupKey = (typeof groupOrder)[number];

const groupLabels: Record<GroupKey, string> = {
  core: "核心",
  assets: "资产",
  growth: "增长",
  settings: "设置",
};

const defaultCollapsed: Record<GroupKey, boolean> = {
  core: false,
  assets: false,
  growth: true,
  settings: true,
};

export function Sidebar({
  open,
  onClose,
  onOpenModal,
}: {
  open: boolean;
  onClose: () => void;
  onOpenModal: (k: ModalKey) => void;
}) {
  const [collapsed, setCollapsed] = useState<Record<GroupKey, boolean>>(defaultCollapsed);

  const grouped = groupOrder.map((g) => ({
    key: g,
    label: groupLabels[g],
    items: sidebarItems.filter((it) => it.group === g),
  }));

  return (
    <>
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm animate-bubble-in"
          onClick={onClose}
        />
      )}
      <aside
        className={`
          z-50 md:z-10 fixed md:sticky top-0 md:top-0 max-h-dvh md:max-h-[calc(100vh-4rem)]
          w-72 shrink-0 glass-strong border-r border-gold/12
          transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
          flex flex-col
        `}
      >
        <div className="p-4 border-b border-gold/15 md:hidden flex items-center justify-between shrink-0">
          <span className="font-display text-gold">戏命师 · 菜单</span>
          <button onClick={onClose} className="text-muted-foreground" aria-label="关闭菜单">
            <X size={17} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin p-3">
          {grouped.map((group) => {
            const isCollapsed = collapsed[group.key];
            const hasItems = group.items.length > 0;
            if (!hasItems) return null;

            const isLowPriority = group.key === "growth" || group.key === "settings";

            return (
              <div key={group.key} className={isLowPriority ? "mt-2" : "mt-1"}>
                <button
                  onClick={() =>
                    setCollapsed((prev) => ({ ...prev, [group.key]: !prev[group.key] }))
                  }
                  className="flex items-center gap-1.5 w-full px-1 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 hover:text-muted-foreground transition-colors"
                >
                  <ChevronDown
                    size={12}
                    className={`transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                  />
                  {group.label}
                  <span className="text-[10px] text-muted-foreground/70">
                    ({group.items.length})
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {group.items.map((it) => {
                      const isActiveRoute = it.key === "chat";
                      const hasModal = connectedKeys.has(it.key);

                      return (
                        <button
                          key={it.key}
                          onClick={() => {
                            if (isActiveRoute) {
                              onClose();
                              return;
                            }
                            if (!hasModal) return;
                            const m = itemToModal[it.key];
                            if (m) onOpenModal(m);
                            onClose();
                          }}
                          className={`
                            group w-full text-left px-3 py-2.5 rounded-xl flex items-start gap-3
                            border transition-all
                            ${
                              isActiveRoute
                                ? "bg-gradient-to-r from-primary/24 to-accent/10 border-gold/32 shadow-[inset_0_1px_0_oklch(0.9_0.08_86_/_0.08)]"
                                : hasModal
                                  ? "border-transparent nav-item-quiet hover:border-gold/16 hover:bg-secondary/24"
                                  : "border-transparent opacity-50"
                            }
                          `}
                          aria-disabled={!(isActiveRoute || hasModal)}
                        >
                          <span
                            className={
                              isActiveRoute
                                ? "text-gold shrink-0 mt-0.5"
                                : hasModal
                                  ? "text-muted-foreground shrink-0 mt-0.5 group-hover:text-gold"
                                  : "text-muted-foreground/70 shrink-0 mt-0.5"
                            }
                          >
                            {itemIcons[it.key] ?? <Sparkles size={17} />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={`block text-sm font-medium ${
                                isActiveRoute
                                  ? "text-bone"
                                  : hasModal
                                    ? "text-bone group-hover:text-gold transition-colors"
                                    : "text-muted-foreground/80"
                              }`}
                            >
                              {it.label}
                            </span>
                            {it.note && (
                              <span
                                className={`block text-[11px] mt-0.5 truncate ${
                                  isActiveRoute || hasModal
                                    ? "text-muted-foreground"
                                    : "text-muted-foreground/70"
                                }`}
                              >
                                {it.note}
                              </span>
                            )}
                          </span>
                          <span className="flex items-center gap-1 shrink-0">
                            {isActiveRoute && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold/20 text-gold font-semibold">
                                NOW
                              </span>
                            )}
                            {!isActiveRoute && !hasModal && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary/30 text-muted-foreground/70">
                                即将
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gold/15 shrink-0">
          <div className="rounded-xl p-3 talisman-border bg-card/60">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">气运值</span>
              <span className="font-display text-gold text-shadow-gold">1,280</span>
            </div>
            <div className="mt-2 h-1.5 bg-secondary/60 rounded-full overflow-hidden">
              <div className="h-full gradient-gold" style={{ width: "64%" }} />
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              距下一品阶 · 人玑 还差 720 气运
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
