import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import {
  applyEarnAccess,
  checkInDaily,
  ensureSession,
  generateShareCard,
  sendMessage,
} from "@/lib/api/xms.functions";
import type { AppBootstrap, ChatMsg, ShareAsset } from "@/lib/domain";
import type { ModalKey } from "@/lib/types";

export const Route = createFileRoute("/try")({
  head: () => ({
    meta: [
      { title: "网页试用 · 戏命师" },
      {
        name: "description",
        content: "在线体验戏命师网页聊天。",
      },
    ],
  }),
  component: TryChat,
});

function TryChat() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<ModalKey | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMsg[]>([]);
  const [latestShare, setLatestShare] = useState<ShareAsset | null>(null);

  const bootstrapQuery = useQuery({
    queryKey: ["xms-bootstrap"],
    queryFn: () => ensureSession(),
  });

  const bootstrap = bootstrapQuery.data as AppBootstrap | undefined;
  const user = bootstrap?.user ?? null;
  const daily = bootstrap?.daily ?? null;
  const messages = useMemo(
    () => [...(bootstrap?.messages ?? []), ...optimisticMessages],
    [bootstrap?.messages, optimisticMessages],
  );

  const sendMutation = useMutation({
    mutationFn: (text: string) => {
      if (!bootstrap?.threadId) throw new Error("会话还没准备好");
      return sendMessage({ data: { threadId: bootstrap.threadId, text } });
    },
    onMutate: (text) => {
      const optimistic: ChatMsg = {
        id: `pending_${Date.now()}`,
        role: "user",
        type: "text",
        text,
        createdAt: new Date().toISOString(),
      };
      setOptimisticMessages((current) => [...current, optimistic]);
    },
    onSuccess: () => {
      setOptimisticMessages([]);
      queryClient.invalidateQueries({ queryKey: ["xms-bootstrap"] });
    },
    onError: (error) => {
      setOptimisticMessages((current) => [
        ...current,
        {
          id: `err_${Date.now()}`,
          role: "master",
          type: "text",
          text: error instanceof Error ? `推演卡住了：${error.message}` : "推演卡住了，稍后再叩。",
        },
      ]);
    },
  });

  const checkInMutation = useMutation({
    mutationFn: () => checkInDaily(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["xms-bootstrap"] });
    },
  });

  const shareMutation = useMutation({
    mutationFn: (kind: "seal" | "daily" | "earn") => generateShareCard({ data: { kind } }),
    onSuccess: (asset) => {
      setLatestShare(asset);
      queryClient.invalidateQueries({ queryKey: ["xms-bootstrap"] });
    },
  });

  const earnMutation = useMutation({
    mutationFn: (input: { offer: string; audience: string; priceRange: string }) =>
      applyEarnAccess({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["xms-bootstrap"] });
    },
  });

  function unlockSeal() {
    setModal("seal");
  }

  function onPaidSeal() {
    // Invalidate all relevant caches
    queryClient.invalidateQueries({ queryKey: ["xms-bootstrap"] });
    queryClient.invalidateQueries({ queryKey: ["operator-status"] });
    queryClient.invalidateQueries({ queryKey: ["blindbox-draws"] });
    queryClient.invalidateQueries({ queryKey: ["user-assets"] });
    setOptimisticMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "master",
        type: "text",
        text: "命盘封印已解，前世今生、流日流年尽在掌中。道友请看最新命谱：",
      },
      {
        id: crypto.randomUUID(),
        role: "master",
        type: "card",
        card: { kind: "seal", unlocked: 100 },
      },
    ]);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar
        user={
          user ?? { level: "见习命师", asksToday: 0, asksMax: 1, qiyun: 0, wallet: 0, unread: 0 }
        }
        onOpen={setModal}
        onToggleSidebar={() => setSidebarOpen((s) => !s)}
      />

      <div className="flex flex-1 min-h-0">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpenModal={(k) => {
            if (k === "greet") checkInMutation.mutate();
            setModal(k);
          }}
        />

        <main className="flex-1 flex min-w-0">
          <ChatWindow
            messages={messages}
            onOpenModal={(k) => setModal(k)}
            sealUnlocked={user?.sealUnlocked ?? 30}
            onUnlockSeal={unlockSeal}
            onSendMessage={(text) => sendMutation.mutate(text)}
            isSending={sendMutation.isPending}
            isReady={!!bootstrap?.threadId && !bootstrapQuery.isError && !bootstrapQuery.isLoading}
            isBootstrapError={bootstrapQuery.isError}
            daily={daily}
            user={user}
          />
          <RightPanel onOpenModal={(k) => setModal(k)} />
        </main>
      </div>

      <TopupModal open={modal === "topup"} onClose={() => setModal(null)} />
      <SubModal open={modal === "sub"} onClose={() => setModal(null)} />
      <BoxModal open={modal === "box"} onClose={() => setModal(null)} />
      <MarketDrawer open={modal === "market"} onClose={() => setModal(null)} />
      <EarnDrawer
        open={modal === "earn"}
        onClose={() => setModal(null)}
        onApply={(input) => earnMutation.mutate(input)}
        isApplying={earnMutation.isPending}
        application={bootstrap?.earnApplication ?? null}
      />
      <ShareModal
        open={modal === "share"}
        onClose={() => setModal(null)}
        shareAsset={latestShare ?? bootstrap?.shareAsset ?? null}
        onGenerate={(kind) => shareMutation.mutate(kind)}
        isGenerating={shareMutation.isPending}
      />
      <GreetModal
        open={modal === "greet"}
        onClose={() => setModal(null)}
        streak={user?.streak ?? 0}
        alreadyChecked={checkInMutation.data?.alreadyChecked ?? daily?.checkedIn ?? false}
      />
      <SealModal open={modal === "seal"} onClose={() => setModal(null)} onPaid={onPaidSeal} />
    </div>
  );
}
