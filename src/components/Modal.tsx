import { AnimatePresence, motion } from "framer-motion";
import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  side = "center",
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  side?: "center" | "right" | "bottom";
  size?: "sm" | "md" | "lg" | "xl";
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const sizes = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" }[size];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-stretch justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-background/85 backdrop-blur-md" onClick={onClose} />
          <motion.div
            initial={
              side === "right"
                ? { x: "100%" }
                : side === "bottom"
                ? { y: "100%" }
                : { opacity: 0, scale: 0.96, y: 10 }
            }
            animate={side === "right" || side === "bottom" ? { x: 0, y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={
              side === "right"
                ? { x: "100%" }
                : side === "bottom"
                ? { y: "100%" }
                : { opacity: 0, scale: 0.96, y: 10 }
            }
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className={`
              relative z-10 scroll-card overflow-hidden flex flex-col
              ${side === "right"
                ? "ml-auto h-full w-full sm:w-[28rem] md:w-[34rem] rounded-l-3xl rounded-r-none border-r-0"
                : side === "bottom"
                ? "mt-auto w-full max-h-[88vh] rounded-t-3xl rounded-b-none border-b-0"
                : `m-auto w-[calc(100%-2rem)] ${sizes} max-h-[88vh] rounded-3xl`}
            `}
          >
            <div className="px-5 md:px-6 pt-5 pb-3 border-b border-gold/15 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-lg md:text-xl text-gold-gradient text-shadow-gold">{title}</h3>
                {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="h-8 w-8 rounded-lg bg-secondary/60 grid place-items-center text-muted-foreground hover:text-bone">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin px-5 md:px-6 py-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
