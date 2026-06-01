import { motion } from "framer-motion";
import masterImg from "@/assets/master.png";

export function MasterAvatar({ size = 64, breath = true }: { size?: number; breath?: boolean }) {
  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      {/* glow ring */}
      <div
        className="absolute inset-0 rounded-full blur-xl opacity-60"
        style={{
          background: "radial-gradient(circle, oklch(0.6 0.25 305 / 0.7), transparent 70%)",
        }}
      />
      {/* rotating compass ring */}
      <div className="absolute inset-0 animate-spin-slow opacity-50">
        <div className="absolute inset-0 rounded-full border border-dashed border-gold" />
        <div className="absolute inset-1 rounded-full border border-dotted border-primary/60" />
      </div>
      <motion.img
        src={masterImg}
        alt="戏命师 命由天瞳"
        className={
          breath ? "animate-breath relative z-10 object-contain" : "relative z-10 object-contain"
        }
        style={{ width: size, height: size }}
        draggable={false}
      />
    </div>
  );
}
