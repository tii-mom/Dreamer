import { sidebarItems } from "@/lib/mock-data";
import type { ModalKey } from "@/lib/types";

const itemToModal: Record<string, ModalKey | undefined> = {
  sub: "sub",
  topup: "topup",
  box: "box",
  market: "market",
  earn: "earn",
  greet: "greet",
  chart: "seal",
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
  return (
    <>
      {/* mobile overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm animate-bubble-in"
          onClick={onClose}
        />
      )}
      <aside
        className={`
          z-50 md:z-10 fixed md:sticky top-0 md:top-0 h-screen md:h-[calc(100vh-4rem)]
          w-72 shrink-0 glass-strong border-r border-gold/15
          transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
          flex flex-col
        `}
      >
        <div className="p-4 border-b border-gold/15 md:hidden flex items-center justify-between">
          <span className="font-display text-gold">戏命师 · 菜单</span>
          <button onClick={onClose} className="text-muted-foreground">✕</button>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-1.5">
          {sidebarItems.map((it, i) => {
            const isPrimary = it.key === "chat";
            return (
              <button
                key={it.key}
                onClick={() => {
                  const m = itemToModal[it.key];
                  if (m) onOpenModal(m);
                  onClose();
                }}
                className={`
                  group w-full text-left px-3 py-2.5 rounded-xl flex items-start gap-3
                  border transition-all
                  ${
                    isPrimary
                      ? "bg-gradient-to-r from-primary/30 to-accent/15 border-gold/40 glow-purple"
                      : "border-transparent hover:border-gold/20 hover:bg-secondary/40"
                  }
                `}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <span className="text-lg shrink-0 mt-0.5">{it.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-bone group-hover:text-gold transition">
                    {it.label}
                  </span>
                  {it.note && (
                    <span className="block text-[11px] text-muted-foreground mt-0.5 truncate">
                      {it.note}
                    </span>
                  )}
                </span>
                {isPrimary && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold/20 text-gold font-semibold">
                    NOW
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gold/15">
          <div className="rounded-xl p-3 talisman-border bg-card/60">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">气运值</span>
              <span className="font-display text-gold text-shadow-gold">1,280</span>
            </div>
            <div className="mt-2 h-1.5 bg-secondary/60 rounded-full overflow-hidden">
              <div className="h-full gradient-gold" style={{ width: "64%" }} />
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">距下一品阶 · 人玑 还差 720 气运</p>
          </div>
        </div>
      </aside>
    </>
  );
}
