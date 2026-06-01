import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MasterAvatar } from "./MasterAvatar";
import { quickAsk } from "@/lib/mock-data";
import type { CardPayload, ChatMsg, DailyState, UserProfile } from "@/lib/domain";
import type { ModalKey } from "@/lib/types";
import {
  AlertCircle,
  FileText,
  Gift,
  Lock,
  MessageCircle,
  Send,
  Share2,
  ShoppingBag,
  Sparkles,
  Store,
  SunMedium,
} from "lucide-react";

export function ChatWindow({
  messages,
  onOpenModal,
  sealUnlocked,
  onUnlockSeal,
  onSendMessage,
  isSending,
  isReady,
  isBootstrapError,
  daily,
  user,
}: {
  messages: ChatMsg[];
  onOpenModal: (k: ModalKey) => void;
  sealUnlocked: number;
  onUnlockSeal: () => void;
  onSendMessage: (text: string) => void;
  isSending: boolean;
  isReady: boolean;
  isBootstrapError: boolean;
  daily: DailyState | null;
  user: UserProfile | null;
}) {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isSending]);

  function handleQuick(topic: string) {
    if (isSending || !isReady) return;
    onSendMessage(topic);
  }

  function handleSend() {
    const text = input.trim();
    if (!text || isSending || !isReady) return;
    setInput("");
    onSendMessage(text);
  }

  const isInitialLoading = !isReady && !isBootstrapError;
  const isEmpty = isReady && messages.length === 0;

  return (
    <section className="flex-1 flex flex-col min-h-0 min-w-0 relative command-shell">
      {/* header */}
      <div className="h-16 px-4 md:px-6 flex items-center justify-between border-b border-gold/12 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            <MasterAvatar size={44} />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full sigil-dot border-2 border-background" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display text-gold-gradient text-base md:text-lg tracking-wide">
                戏命师 · 命由天瞳
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gold/10 border border-gold/25 text-gold">
                {user?.level ?? "见习命师"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              命盘通道已接入 · 连续问安 {user?.streak ?? 0} 日 · 亮度 {user?.chartGlow ?? 30}%
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 rounded-full border border-gold/15 bg-secondary/20 px-3 py-1.5 text-[11px] text-muted-foreground">
          <Sparkles size={12} className="text-gold" />
          <span>今日问事</span>
          <span className="font-semibold text-gold">
            {daily?.asksUsed ?? 0}/{daily?.asksMax ?? 1}
          </span>
        </div>
      </div>

      {/* chat area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin rune-pattern chat-field px-3 md:px-7 py-6">
        {isBootstrapError ? (
          <div className="flex flex-col items-center justify-center min-h-full gap-4 py-12 px-6 text-center">
            <MasterAvatar size={56} />
            <div className="flex flex-col items-center gap-1">
              <p className="text-sm text-bone/80 font-display">命盘通道中断</p>
              <p className="text-xs text-muted-foreground max-w-[260px]">
                无法接通戏命师的星盘，请稍后刷新页面重试。
              </p>
            </div>
          </div>
        ) : isInitialLoading ? (
          <div className="flex flex-col items-center justify-center min-h-full gap-4 py-12">
            <MasterAvatar size={56} />
            <div className="flex flex-col items-center gap-2">
              <div className="h-3 w-32 rounded-full bg-secondary/30 animate-pulse" />
              <div className="h-2 w-48 rounded-full bg-secondary/20 animate-pulse" />
            </div>
            <p className="text-xs text-muted-foreground">正在接通命盘通道...</p>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center min-h-full gap-4 py-12 px-6 text-center">
            <MasterAvatar size={64} />
            <p className="text-sm text-bone/80 font-display">命盘已备好，等你叩问</p>
            <p className="text-xs text-muted-foreground max-w-[260px]">
              选一个话题开始叩问，或在输入栏写下你的问题
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m) => (
              <Bubble
                key={m.id}
                msg={m}
                onOpenModal={onOpenModal}
                sealUnlocked={sealUnlocked}
                onUnlockSeal={onUnlockSeal}
                onQuick={handleQuick}
              />
            ))}
            {isSending && (
              <div className="flex items-end gap-2 justify-start">
                <MasterAvatar size={36} breath={false} />
                <div className="px-4 py-2.5 rounded-2xl rounded-bl-md bg-secondary/35 border border-gold/20 text-sm text-muted-foreground shadow-lg flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full sigil-dot animate-pulse" />
                  天机正在落盘
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* quick ask */}
      <div className="px-3 md:px-7 pt-3 pb-1 shrink-0 border-t border-gold/10">
        <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1 snap-x snap-mandatory -mx-1 px-1">
          {quickAsk.map((q) => (
            <button
              key={q}
              onClick={() => handleQuick(q)}
              disabled={isSending || !isReady}
              className="px-3 h-8 rounded-full text-xs border border-gold/18 bg-secondary/24 text-bone/90 hover:bg-gold/10 hover:text-gold hover:border-gold/35 transition whitespace-nowrap disabled:opacity-40 snap-start shrink-0"
            >
              {q}
            </button>
          ))}
          <button
            onClick={() => handleQuick("申请出马赚钱")}
            disabled={isSending || !isReady}
            className="px-3 h-8 rounded-full text-xs border border-gold/35 bg-gold/10 text-gold hover:bg-gold/18 transition whitespace-nowrap disabled:opacity-40 snap-start shrink-0"
          >
            申请出马赚钱
          </button>
        </div>
      </div>

      {/* input */}
      <div className="px-3 md:px-7 py-3 shrink-0">
        <div
          className={`flex items-center gap-3 input-altar rounded-2xl pl-4 pr-2 py-2 transition-colors ${
            isSending || !isReady ? "border-gold/30" : "focus-within:border-gold/50"
          } ${!input.trim() && !isSending ? "border-gold/20" : ""}`}
        >
          <MessageCircle
            size={18}
            className={`shrink-0 ${isSending || !isReady ? "text-gold/40" : "text-gold/80"}`}
          />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={
              isSending
                ? "正在推演..."
                : !isReady
                  ? "等待命盘就绪..."
                  : "向戏命师问事，别问太蠢的……"
            }
            disabled={isSending || !isReady}
            className="flex-1 bg-transparent outline-none text-sm text-bone placeholder:text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
          />
          <button
            onClick={handleSend}
            disabled={isSending || !isReady || !input.trim()}
            className="ritual-btn h-9 min-w-[4.5rem] px-4 rounded-xl text-sm flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 transition-opacity"
          >
            {isSending ? (
              <>
                <span className="inline-block h-3 w-3 rounded-full border-2 border-current border-r-transparent animate-spin" />
                推演
              </>
            ) : (
              <>
                <Send size={14} /> 叩问
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

function Bubble({
  msg,
  onOpenModal,
  sealUnlocked,
  onUnlockSeal,
  onQuick,
}: {
  msg: ChatMsg;
  onOpenModal: (k: ModalKey) => void;
  sealUnlocked: number;
  onUnlockSeal: () => void;
  onQuick: (q: string) => void;
}) {
  const isUser = msg.role === "user";
  const isError =
    !isUser && msg.role === "master" && msg.type === "text" && msg.id.startsWith("err_");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
      className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="shrink-0 self-end">
          <MasterAvatar size={36} breath={false} />
        </div>
      )}
      <div
        className={`max-w-[85%] md:max-w-[72%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}
      >
        {msg.type === "text" ? (
          <div
            className={
              isUser
                ? "px-4 py-2.5 rounded-2xl rounded-br-md bg-gradient-to-br from-primary/95 to-primary/62 text-primary-foreground text-sm shadow-lg whitespace-pre-line break-words"
                : isError
                  ? "px-4 py-2.5 rounded-2xl rounded-bl-md bg-destructive/15 border border-destructive/30 text-sm text-bone shadow-lg whitespace-pre-line break-words flex items-start gap-2"
                  : "px-4 py-2.5 rounded-2xl rounded-bl-md bg-secondary/32 border border-gold/14 text-sm text-bone shadow-lg whitespace-pre-line break-words"
            }
          >
            {isError && <AlertCircle size={14} className="text-destructive shrink-0 mt-0.5" />}
            <span>{msg.text}</span>
          </div>
        ) : (
          <CardMessage
            card={msg.card}
            onOpenModal={onOpenModal}
            sealUnlocked={sealUnlocked}
            onUnlockSeal={onUnlockSeal}
            onQuick={onQuick}
          />
        )}
      </div>
      {isUser && (
        <div className="h-9 w-9 shrink-0 rounded-full bg-secondary/70 grid place-items-center font-display text-sm text-gold border border-gold/24">
          天
        </div>
      )}
    </motion.div>
  );
}

function CardMessage({
  card,
  onOpenModal,
  sealUnlocked,
  onUnlockSeal,
  onQuick,
}: {
  card: CardPayload;
  onOpenModal: (k: ModalKey) => void;
  sealUnlocked: number;
  onUnlockSeal: () => void;
  onQuick: (q: string) => void;
}) {
  if (card.kind === "reading") {
    return (
      <div className="scroll-card rounded-2xl rounded-bl-md p-4 w-[20rem] md:w-[24rem] max-w-full">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={14} className="text-gold shrink-0" />
          <span className="text-xs font-semibold text-gold-gradient tracking-wide truncate">
            {card.title}
          </span>
        </div>
        <p className="text-[11px] text-accent mb-2 font-display">— {card.topic} —</p>
        <p className="text-sm text-bone leading-relaxed break-words">{card.body}</p>
        <div className="mt-3 flex gap-2 flex-wrap">
          <button
            onClick={onUnlockSeal}
            className="text-xs px-3 h-8 rounded-lg bg-secondary/70 border border-gold/20 text-bone hover:border-gold/50 transition-colors"
          >
            查看完整报告
          </button>
          <button
            onClick={() => onOpenModal("share")}
            className="text-xs px-3 h-8 rounded-lg bg-secondary/70 border border-gold/20 text-bone hover:border-gold/50 transition-colors flex items-center gap-1"
          >
            <Share2 size={12} /> 生成分享卡
          </button>
          <button
            onClick={() => onQuick("看今日")}
            className="text-xs px-3 h-8 rounded-lg ritual-btn"
          >
            再问一次
          </button>
        </div>
      </div>
    );
  }
  if (card.kind === "seal") {
    const pct = Math.max(sealUnlocked, card.unlocked);
    return (
      <div className="scroll-card rounded-2xl rounded-bl-md p-4 w-[20rem] md:w-[24rem] max-w-full relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/10 blur-2xl" />
        <div className="flex items-center gap-2 mb-2 relative">
          <Lock size={14} className="text-gold shrink-0" />
          <span className="text-xs font-semibold text-gold-gradient">
            {pct < 100 ? `你的命盘已排出，但只露出 ${pct}%` : "命盘已完全解封"}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 my-3 relative">
          {Array.from({ length: 12 }).map((_, i) => {
            const visible = i < Math.round((pct / 100) * 12);
            return (
              <div
                key={i}
                className={`aspect-square rounded-lg grid place-items-center text-[10px] font-display ${
                  visible
                    ? "bg-gradient-to-br from-primary/40 to-accent/20 border border-gold/40 text-gold text-shadow-gold"
                    : "bg-secondary/40 border border-border text-muted-foreground/40 backdrop-blur-sm"
                }`}
              >
                {visible
                  ? i === 0
                    ? "紫微"
                    : i === 5
                      ? "财帛"
                      : ["命", "兄", "夫", "子", "财", "疾", "迁", "友", "官", "田", "福", "父"][i]
                  : "❖"}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          命宫主星：<span className="text-gold">紫微</span> 身宫：
          <span className="text-gold">财帛</span>
        </p>
        {pct < 100 && (
          <div className="mt-3 flex gap-2 flex-wrap">
            <button onClick={onUnlockSeal} className="text-xs px-3 h-8 rounded-lg ritual-btn">
              解封命盘 ¥5.99
            </button>
            <button
              onClick={() => onOpenModal("share")}
              className="text-xs px-3 h-8 rounded-lg bg-secondary/70 border border-gold/20 text-bone hover:border-gold/50 transition-colors"
            >
              生成助力卡
            </button>
          </div>
        )}
      </div>
    );
  }
  if (card.kind === "daily") {
    return (
      <div className="scroll-card rounded-2xl rounded-bl-md p-4 w-[20rem] md:w-[24rem] max-w-full">
        <div className="flex items-center gap-2 mb-1">
          <SunMedium size={14} className="text-gold shrink-0" />
          <span className="text-xs font-semibold text-gold-gradient">今日流日 · 活命盘</span>
        </div>
        <p className="text-[11px] text-accent mb-2 font-display">— {card.title} —</p>
        <p className="text-sm text-bone leading-relaxed break-words">{card.body}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Mini label="吉时" value={card.luckyHour} accent />
          <Mini label="财神方位" value={card.direction} accent />
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => onOpenModal("share")}
            className="text-xs px-3 h-8 rounded-lg ritual-btn flex-1"
          >
            生成流日卡
          </button>
          <button
            onClick={() => onQuick("申请出马赚钱")}
            className="text-xs px-3 h-8 rounded-lg bg-secondary/70 border border-gold/20 text-bone hover:border-gold/50 transition-colors"
          >
            让它变现
          </button>
        </div>
      </div>
    );
  }
  if (card.kind === "sub") {
    return (
      <div className="scroll-card rounded-2xl rounded-bl-md p-4 w-[20rem] md:w-[24rem] max-w-full">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={14} className="text-gold shrink-0" />
          <span className="text-xs font-semibold text-gold-gradient">趋吉避凶 · 候补契约</span>
        </div>
        <div className="flex items-baseline gap-2 my-2">
          <span className="font-display text-2xl text-gold text-shadow-gold">¥49.99</span>
          <span className="text-xs text-muted-foreground line-through">¥1999</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive font-semibold">
            首版不收款
          </span>
        </div>
        <ul className="text-xs text-bone space-y-1 mb-3">
          <li>· 每日流日盘 + 吉时提醒</li>
          <li>· 每日问事 3 次，灵签随抽</li>
          <li>· 每月 1 次八字精批</li>
          <li>· 突发星象预警和社群召回</li>
        </ul>
        <button
          onClick={() => onOpenModal("sub")}
          className="text-xs px-3 h-8 rounded-lg ritual-btn w-full"
        >
          加入候补
        </button>
      </div>
    );
  }
  if (card.kind === "shop" || card.kind === "earn") {
    const status = card.kind === "earn" ? card.status : "none";
    return (
      <div className="scroll-card rounded-2xl rounded-bl-md p-4 w-[20rem] md:w-[24rem] max-w-full">
        <div className="flex items-center gap-2 mb-1">
          <Store size={14} className="text-gold shrink-0" />
          <span className="text-xs font-semibold text-gold-gradient">戏命出马 · 资格候补</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          第一版不替你收钱，先给你服务菜单、报告生成和客户表单。你负责获客收款，我负责把话术和报告打磨到能转发。
        </p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <Mini label="候补状态" value={status === "none" ? "未申请" : "排队中"} />
          <Mini label="建议客单" value="¥30-99" accent />
          <Mini label="推荐客单" value="高" accent />
        </div>
        <button
          onClick={() => onOpenModal("earn")}
          className="text-xs px-3 h-8 rounded-lg ritual-btn w-full"
        >
          申请出马资格
        </button>
      </div>
    );
  }
  if (card.kind === "box") {
    return (
      <div className="scroll-card rounded-2xl rounded-bl-md p-4 w-[20rem] md:w-[24rem] max-w-full">
        <div className="flex items-center gap-2 mb-1">
          <Gift size={14} className="text-gold shrink-0" />
          <span className="text-xs font-semibold text-gold-gradient">戏命师盲盒</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          天枢、地璇、人玑、混沌，谁愿意替你改命，看你手气。
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => onOpenModal("box")}
            className="text-xs px-3 h-8 rounded-lg ritual-btn flex-1"
          >
            抽取铭文
          </button>
          <Link
            to="/blindbox"
            className="text-xs px-3 h-8 rounded-lg bg-secondary/70 border border-gold/20 text-bone hover:border-gold/50 transition-colors inline-flex items-center"
          >
            商店
          </Link>
        </div>
      </div>
    );
  }
  if (card.kind === "market") {
    return (
      <div className="scroll-card rounded-2xl rounded-bl-md p-4 w-[20rem] md:w-[24rem] max-w-full">
        <div className="flex items-center gap-2 mb-2">
          <ShoppingBag size={14} className="text-gold shrink-0" />
          <span className="text-xs font-semibold text-gold-gradient">命师交易所 · 运营预览</span>
        </div>
        <ul className="text-xs text-bone space-y-1.5 mb-3">
          <li className="flex justify-between">
            <span>天枢命师</span>
            <span className="text-gold">¥3,888</span>
          </li>
          <li className="flex justify-between">
            <span>地璇命师</span>
            <span className="text-gold">¥1,288</span>
          </li>
          <li className="flex justify-between">
            <span>武曲贪狼印铭文</span>
            <span className="text-gold">¥666</span>
          </li>
        </ul>
        <button
          onClick={() => onOpenModal("market")}
          className="text-xs px-3 h-8 rounded-lg ritual-btn w-full"
        >
          进入市场
        </button>
      </div>
    );
  }
  if (card.kind === "share") {
    return (
      <div className="scroll-card rounded-2xl rounded-bl-md p-4 w-[20rem] md:w-[24rem] max-w-full">
        <div className="flex items-center gap-2 mb-2">
          <Share2 size={14} className="text-gold shrink-0" />
          <span className="text-xs font-semibold text-gold-gradient">分享卡已生成</span>
        </div>
        <p className="text-sm text-bone leading-relaxed break-words">{card.copy}</p>
        <a
          href={card.url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex h-8 px-3 rounded-lg ritual-btn text-xs items-center justify-center"
        >
          打开分享卡
        </a>
      </div>
    );
  }
  return null;
}

function Mini({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-secondary/60 border border-border p-2 text-center">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div
        className={`text-sm font-display ${accent ? "text-gold text-shadow-gold" : "text-bone"}`}
      >
        {value}
      </div>
    </div>
  );
}
