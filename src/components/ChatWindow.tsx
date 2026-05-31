import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { MasterAvatar } from "./MasterAvatar";
import { quickAsk, replyByTopic, type ChatMsg, type CardPayload } from "@/lib/mock-data";
import type { ModalKey } from "@/lib/types";
import { Send, Lock, Sparkles, ShoppingBag, Gift, Store, FileText, Share2 } from "lucide-react";

export function ChatWindow({
  messages,
  setMessages,
  onOpenModal,
  sealUnlocked,
  onUnlockSeal,
}: {
  messages: ChatMsg[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMsg[]>>;
  onOpenModal: (k: ModalKey) => void;
  sealUnlocked: number;
  onUnlockSeal: () => void;
}) {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  function pushUser(text: string) {
    const id = crypto.randomUUID();
    setMessages((m) => [...m, { id, role: "user", type: "text", text }]);
  }

  function handleQuick(topic: string) {
    pushUser(topic);
    const data = replyByTopic[topic];
    setTimeout(() => {
      const id1 = crypto.randomUUID();
      setMessages((m) => [
        ...m,
        { id: id1, role: "master", type: "text", text: data ? "稍候，我推一下盘……" : "嗯？这问题我得想想。" },
      ]);
    }, 400);
    if (data) {
      setTimeout(() => {
        const id2 = crypto.randomUUID();
        setMessages((m) => [
          ...m,
          { id: id2, role: "master", type: "card", card: { kind: "reading", title: data.reading.title, topic: data.reading.topic, body: data.reading.body } },
        ]);
      }, 1100);
      if (data.followup) {
        setTimeout(() => {
          const id3 = crypto.randomUUID();
          const f = data.followup!;
          const text =
            f === "sub"
              ? "想让我每天盯着你的财星？49.99/月，我替你看。"
              : f === "shop"
              ? "替别人也算一卦？开你的小铺子，我替你接单。"
              : "顺手抽个盲盒，看看哪位命师愿意替你改命。";
          setMessages((m) => [
            ...m,
            { id: id3, role: "master", type: "text", text },
            { id: crypto.randomUUID(), role: "master", type: "card", card: { kind: f as any } },
          ]);
        }, 1800);
      }
    }
  }

  function handleSend() {
    if (!input.trim()) return;
    pushUser(input.trim());
    const t = input.trim();
    setInput("");
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "master",
          type: "text",
          text: `"${t}"——这事儿我看出来了，但天机不可白泄。先解封命盘，或者订阅每日问事，我细说。`,
        },
        { id: crypto.randomUUID(), role: "master", type: "card", card: { kind: "sub" } },
      ]);
    }, 600);
  }

  return (
    <section className="flex-1 flex flex-col min-h-0 min-w-0 relative">
      {/* chat header */}
      <div className="h-16 px-4 md:px-6 flex items-center justify-between glass border-b border-gold/15 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            <MasterAvatar size={44} />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-background" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display text-gold-gradient text-base md:text-lg">戏命师 · 命由天瞳</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/60 border border-gold/30 text-gold">
                见习命师
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">在线，正在偷看你的命盘 · 好感度 熟悉(42)</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><Sparkles size={12} className="text-gold" />今日 1/3</span>
        </div>
      </div>

      {/* message list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin rune-pattern px-3 md:px-6 py-5 space-y-4">
        {messages.map((m) => (
          <Bubble key={m.id} msg={m} onOpenModal={onOpenModal} sealUnlocked={sealUnlocked} onUnlockSeal={onUnlockSeal} onQuick={handleQuick} />
        ))}
        <div ref={endRef} />
      </div>

      {/* quick asks */}
      <div className="px-3 md:px-6 pt-2 pb-1 shrink-0 overflow-x-auto scrollbar-thin">
        <div className="flex gap-2 min-w-max">
          {quickAsk.map((q) => (
            <button
              key={q}
              onClick={() => handleQuick(q)}
              className="px-3 h-8 rounded-full text-xs border border-gold/25 bg-secondary/40 text-bone hover:bg-gold/10 hover:text-gold transition whitespace-nowrap"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* input */}
      <div className="px-3 md:px-6 py-3 shrink-0">
        <div className="flex items-center gap-2 glass rounded-2xl pl-4 pr-2 py-2 border border-gold/20 focus-within:border-gold/50 transition">
          <span className="text-gold text-lg leading-none">🕯️</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="向戏命师问事，别问太蠢的……"
            className="flex-1 bg-transparent outline-none text-sm text-bone placeholder:text-muted-foreground"
          />
          <button
            onClick={handleSend}
            className="ritual-btn h-9 px-4 rounded-xl text-sm flex items-center gap-1.5"
          >
            <Send size={14} /> 叩问
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
      className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="shrink-0">
          <MasterAvatar size={36} breath={false} />
        </div>
      )}
      <div className={`max-w-[85%] md:max-w-[72%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        {msg.type === "text" ? (
          <div
            className={
              isUser
                ? "px-4 py-2.5 rounded-2xl rounded-br-md bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-sm shadow-lg"
                : "px-4 py-2.5 rounded-2xl rounded-bl-md glass border border-gold/15 text-sm text-bone shadow-lg"
            }
          >
            {(msg as any).text}
          </div>
        ) : (
          <CardMessage card={msg.card} onOpenModal={onOpenModal} sealUnlocked={sealUnlocked} onUnlockSeal={onUnlockSeal} onQuick={onQuick} />
        )}
      </div>
      {isUser && (
        <div className="h-9 w-9 shrink-0 rounded-full gradient-purple grid place-items-center font-display text-sm text-gold border border-gold/30">
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
          <FileText size={14} className="text-gold" />
          <span className="text-xs font-semibold text-gold-gradient tracking-wide">{card.title}</span>
        </div>
        <p className="text-[11px] text-accent mb-2 font-display">— {card.topic} —</p>
        <p className="text-sm text-bone leading-relaxed">{card.body}</p>
        <div className="mt-3 flex gap-2 flex-wrap">
          <button onClick={onUnlockSeal} className="text-xs px-3 h-8 rounded-lg bg-secondary/70 border border-gold/20 text-bone hover:border-gold/50">
            查看完整报告
          </button>
          <button onClick={() => onOpenModal("share")} className="text-xs px-3 h-8 rounded-lg bg-secondary/70 border border-gold/20 text-bone hover:border-gold/50 flex items-center gap-1">
            <Share2 size={12} /> 生成分享卡
          </button>
          <button onClick={() => onQuick("看今日")} className="text-xs px-3 h-8 rounded-lg ritual-btn">再问一次</button>
        </div>
      </div>
    );
  }
  if (card.kind === "seal") {
    const pct = sealUnlocked;
    return (
      <div className="scroll-card rounded-2xl rounded-bl-md p-4 w-[20rem] md:w-[24rem] max-w-full relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/10 blur-2xl" />
        <div className="flex items-center gap-2 mb-2 relative">
          <Lock size={14} className="text-gold" />
          <span className="text-xs font-semibold text-gold-gradient">
            {pct < 100 ? `你的命盘已排出，但只露出 ${pct}%` : "命盘已完全解封"}
          </span>
        </div>
        {/* mini chart */}
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
                {visible ? (i === 0 ? "紫微" : i === 5 ? "财帛" : ["命", "兄", "夫", "子", "财", "疾", "迁", "友", "官", "田", "福", "父"][i]) : "❖"}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">命宫主星：<span className="text-gold">紫微</span>　身宫：<span className="text-gold">财帛</span></p>
        {pct < 100 && (
          <div className="mt-3 flex gap-2 flex-wrap">
            <button onClick={onUnlockSeal} className="text-xs px-3 h-8 rounded-lg ritual-btn">
              ¥5.99 解封
            </button>
            <button className="text-xs px-3 h-8 rounded-lg bg-secondary/70 border border-gold/20 text-bone">
              召唤 3 位道友助力
            </button>
            <button className="text-xs px-3 h-8 rounded-lg text-muted-foreground hover:text-bone">稍后再说</button>
          </div>
        )}
      </div>
    );
  }
  if (card.kind === "sub") {
    return (
      <div className="scroll-card rounded-2xl rounded-bl-md p-4 w-[20rem] md:w-[24rem] max-w-full">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={14} className="text-gold" />
          <span className="text-xs font-semibold text-gold-gradient">趋吉避凶 · 月令契约</span>
        </div>
        <div className="flex items-baseline gap-2 my-2">
          <span className="font-display text-2xl text-gold text-shadow-gold">¥49.99</span>
          <span className="text-xs text-muted-foreground line-through">¥1999</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive font-semibold">限今日</span>
        </div>
        <ul className="text-xs text-bone space-y-1 mb-3">
          <li>· 每日流日盘 + 吉时提醒</li>
          <li>· 每日问事 3 次，灵签随抽</li>
          <li>· 每月 1 次八字精批</li>
          <li>· 突发星象预警（火星临命、桃花将至…）</li>
        </ul>
        <div className="flex gap-2">
          <button onClick={() => onOpenModal("sub")} className="text-xs px-3 h-8 rounded-lg ritual-btn flex-1">立即订阅</button>
          <button onClick={() => onOpenModal("sub")} className="text-xs px-3 h-8 rounded-lg bg-secondary/70 border border-gold/20 text-bone">先看看权益</button>
        </div>
      </div>
    );
  }
  if (card.kind === "shop") {
    return (
      <div className="scroll-card rounded-2xl rounded-bl-md p-4 w-[20rem] md:w-[24rem] max-w-full">
        <div className="flex items-center gap-2 mb-1">
          <Store size={14} className="text-gold" />
          <span className="text-xs font-semibold text-gold-gradient">戏命出马 · 你的算命铺子</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          你当掌柜，我替你算。你负责发朋友圈收钱，我负责排盘、解读、生成报告。
        </p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <Mini label="昨日单数" value="18" />
          <Mini label="昨日收入" value="¥864" accent />
          <Mini label="净利润" value="¥843" accent />
        </div>
        <div className="flex gap-2">
          <button onClick={() => onOpenModal("earn")} className="text-xs px-3 h-8 rounded-lg ritual-btn flex-1">开通出马权限</button>
          <button onClick={() => onOpenModal("earn")} className="text-xs px-3 h-8 rounded-lg bg-secondary/70 border border-gold/20 text-bone">收益榜</button>
        </div>
      </div>
    );
  }
  if (card.kind === "box") {
    return (
      <div className="scroll-card rounded-2xl rounded-bl-md p-4 w-[20rem] md:w-[24rem] max-w-full">
        <div className="flex items-center gap-2 mb-1">
          <Gift size={14} className="text-gold" />
          <span className="text-xs font-semibold text-gold-gradient">戏命师盲盒</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          天枢、地璇、人玑、混沌，谁愿意替你改命，看你手气。
        </p>
        <div className="flex gap-2">
          <button onClick={() => onOpenModal("box")} className="text-xs px-3 h-8 rounded-lg ritual-btn flex-1">单抽 ¥99</button>
          <button onClick={() => onOpenModal("box")} className="text-xs px-3 h-8 rounded-lg bg-secondary/70 border border-gold/20 text-bone">十连抽</button>
          <button onClick={() => onOpenModal("box")} className="text-xs px-3 h-8 rounded-lg text-muted-foreground">概率</button>
        </div>
      </div>
    );
  }
  if (card.kind === "market") {
    return (
      <div className="scroll-card rounded-2xl rounded-bl-md p-4 w-[20rem] md:w-[24rem] max-w-full">
        <div className="flex items-center gap-2 mb-2">
          <ShoppingBag size={14} className="text-gold" />
          <span className="text-xs font-semibold text-gold-gradient">命师交易所 · 热门挂售</span>
        </div>
        <ul className="text-xs text-bone space-y-1.5 mb-3">
          <li className="flex justify-between"><span>天枢命师</span><span className="text-gold">¥3,888</span></li>
          <li className="flex justify-between"><span>地璇命师</span><span className="text-gold">¥1,288</span></li>
          <li className="flex justify-between"><span>武曲贪狼印铭文</span><span className="text-gold">¥666</span></li>
        </ul>
        <div className="flex gap-2">
          <button onClick={() => onOpenModal("market")} className="text-xs px-3 h-8 rounded-lg ritual-btn flex-1">进入市场</button>
        </div>
      </div>
    );
  }
  return null;
}

function Mini({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-secondary/60 border border-border p-2 text-center">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={`text-sm font-display ${accent ? "text-gold text-shadow-gold" : "text-bone"}`}>{value}</div>
    </div>
  );
}
