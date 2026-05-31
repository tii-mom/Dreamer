import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Sidebar } from "@/components/Sidebar";
import { ChatWindow } from "@/components/ChatWindow";
import { RightPanel } from "@/components/RightPanel";
import {
  TopupModal,
  SubModal,
  BoxModal,
  MarketDrawer,
  EarnDrawer,
  ShareModal,
  GreetModal,
  SealModal,
} from "@/components/Modals";
import { initialMessages, userMock, type ChatMsg } from "@/lib/mock-data";
import type { ModalKey } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "戏命师 · 执笔写命，嘲讽人生剧本" },
      { name: "description", content: "你的好友列表里，住着一个会算命、会怼人、还能帮你赚钱的 AI 戏命师。" },
      { property: "og:title", content: "戏命师" },
      { property: "og:description", content: "AI 命师机器人 · 命理交易市场 · 盲盒养成 · 出马赚钱" },
    ],
  }),
  component: Index,
});

function Index() {
  const [modal, setModal] = useState<ModalKey | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>(initialMessages);
  const [sealUnlocked, setSealUnlocked] = useState(30);

  function unlockSeal() {
    setModal("seal");
  }

  function onPaidSeal() {
    setSealUnlocked(100);
    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), role: "master", type: "text", text: "符纸已焚，封印解。整张命盘交付给你，看不看得懂随你。" },
      { id: crypto.randomUUID(), role: "master", type: "card", card: { kind: "seal", unlocked: 100 } },
    ]);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar
        user={userMock}
        onOpen={setModal}
        onToggleSidebar={() => setSidebarOpen((s) => !s)}
      />

      <div className="flex flex-1 min-h-0">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpenModal={(k) => setModal(k)}
        />

        <main className="flex-1 flex min-w-0">
          <ChatWindow
            messages={messages}
            setMessages={setMessages}
            onOpenModal={(k) => setModal(k)}
            sealUnlocked={sealUnlocked}
            onUnlockSeal={unlockSeal}
          />
          <RightPanel onOpenModal={(k) => setModal(k)} />
        </main>
      </div>

      {/* Modals */}
      <TopupModal open={modal === "topup"} onClose={() => setModal(null)} />
      <SubModal open={modal === "sub"} onClose={() => setModal(null)} />
      <BoxModal open={modal === "box"} onClose={() => setModal(null)} />
      <MarketDrawer open={modal === "market"} onClose={() => setModal(null)} />
      <EarnDrawer open={modal === "earn"} onClose={() => setModal(null)} />
      <ShareModal open={modal === "share"} onClose={() => setModal(null)} />
      <GreetModal open={modal === "greet"} onClose={() => setModal(null)} streak={7} />
      <SealModal open={modal === "seal"} onClose={() => setModal(null)} onPaid={onPaidSeal} />
    </div>
  );
}
