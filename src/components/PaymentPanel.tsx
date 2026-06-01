import { useState, useEffect } from "react";
import { createPaymentOrder, queryPaymentStatus } from "@/lib/api/xms.functions";
import type { ProductCode } from "@/lib/domain";
import { Check, AlertTriangle, Loader2 } from "lucide-react";

type PaymentUiState = "idle" | "creating" | "qr" | "success" | "expired" | "failed";

export function PaymentPanel({
  productCode,
  amountCents,
  onSuccess,
  onCancel,
}: {
  productCode: ProductCode;
  amountCents?: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [payType, setPayType] = useState<"alipay" | "wechat">("alipay");
  const [state, setState] = useState<PaymentUiState>("idle");
  const [orderInfo, setOrderInfo] = useState<{
    orderId: string;
    aoid: string;
    qrImg?: string | null;
    qrPrice?: string | null;
    price: string;
    expiresIn: number;
    isMock: boolean;
  } | null>(null);

  const [timeLeft, setTimeLeft] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  // Start payment creation
  async function handleStartPayment(type: "alipay" | "wechat") {
    setPayType(type);
    setState("creating");
    setErrorMsg("");
    try {
      const res = await createPaymentOrder({
        data: {
          productCode,
          payType: type,
          amountCents,
        },
      });
      if (res && res.status === "ok") {
        setOrderInfo(res);
        setTimeLeft(res.expiresIn);
        setState("qr");
      } else {
        throw new Error("创建支付订单失败");
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "请求失败，请稍后重试");
      setState("failed");
    }
  }

  // Countdown timer
  useEffect(() => {
    if (state !== "qr" || timeLeft <= 0) return;
    const timer = setTimeout(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setState("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [state, timeLeft]);

  // Polling payment status
  useEffect(() => {
    if (state !== "qr" || !orderInfo) return;

    let isSubscribed = true;
    const pollInterval = setInterval(async () => {
      try {
        const res = await queryPaymentStatus({
          data: { orderId: orderInfo.orderId },
        });
        if (!isSubscribed) return;

        if (res.status === "success" || res.status === "mock_success") {
          clearInterval(pollInterval);
          setState("success");
          setTimeout(() => {
            onSuccess();
          }, 1500);
        } else if (res.status === "expire") {
          clearInterval(pollInterval);
          setState("expired");
        } else if (res.status === "failed") {
          clearInterval(pollInterval);
          setState("failed");
          setErrorMsg("支付校验失败，请联系管理员");
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);

    return () => {
      isSubscribed = false;
      clearInterval(pollInterval);
    };
  }, [state, orderInfo, onSuccess]);

  // Mock Success Action Handler
  async function triggerMockSuccess() {
    if (!orderInfo) return;
    try {
      const response = await fetch("/api/pay/mock-success", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderInfo.orderId }),
      });
      const data = await response.json();
      if (data.status === "ok") {
        setState("success");
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err) {
      console.error("Mock success trigger failed:", err);
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (state === "idle") {
    return (
      <div className="flex flex-col items-center py-4">
        <p className="text-sm text-bone mb-4 text-center">选择供奉支付通道</p>
        <div className="flex gap-4 w-full justify-center">
          <button
            onClick={() => handleStartPayment("alipay")}
            className="flex-1 max-w-[120px] h-12 rounded-xl border border-gold/30 hover:border-gold bg-secondary/40 text-gold font-semibold text-sm flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <span>🔵</span> 支付宝
          </button>
          <button
            onClick={() => handleStartPayment("wechat")}
            className="flex-1 max-w-[120px] h-12 rounded-xl border border-gold/30 hover:border-gold bg-secondary/40 text-gold font-semibold text-sm flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <span>🟢</span> 微信支付
          </button>
        </div>
        <button
          onClick={onCancel}
          className="mt-6 text-xs text-muted-foreground hover:text-bone transition"
        >
          暂不解封，退回天机
        </button>
      </div>
    );
  }

  if (state === "creating") {
    return (
      <div className="flex flex-col items-center py-12">
        <Loader2 className="animate-spin text-gold mb-3" size={32} />
        <p className="text-xs text-gold-gradient animate-pulse">正在沟通天机，生成支付法印...</p>
      </div>
    );
  }

  if (state === "qr" && orderInfo) {
    // Check if the user needs to enter amount manually
    const showManualWarning = !orderInfo.qrPrice;

    return (
      <div className="flex flex-col items-center py-2 text-center">
        {orderInfo.qrImg ? (
          <div className="relative p-2 bg-bone rounded-xl border-4 border-gold/40 glow-gold mb-3">
            <img src={orderInfo.qrImg} alt="Payment QR" className="w-44 h-44 object-contain" />
          </div>
        ) : (
          <div className="h-44 w-44 rounded-xl border-2 border-dashed border-gold/40 grid place-items-center mb-3">
            <AlertTriangle className="text-gold" size={32} />
            <span className="text-[10px] text-muted-foreground px-2">二维码加载失败，请重试</span>
          </div>
        )}

        <div className="mb-2">
          <span className="text-xs text-muted-foreground">应付金额：</span>
          <span className="font-display text-2xl text-gold text-shadow-gold">
            ¥{orderInfo.price}
          </span>
        </div>

        {showManualWarning && (
          <div className="mb-3 px-4 py-2 rounded-lg bg-destructive/20 border border-destructive/30 text-[11px] text-destructive flex items-start gap-1.5 max-w-[280px] text-left">
            <AlertTriangle className="shrink-0 mt-0.5" size={14} />
            <div>
              <strong>特别注意：</strong>使用的是不固定金额码，
              <strong>扫码后必须手动修改并输入精确金额：¥{orderInfo.price}</strong>{" "}
              元，否则无法自动到账！
            </div>
          </div>
        )}

        <p className="text-xs text-bone mb-1">
          请使用{payType === "alipay" ? "支付宝" : "微信"}扫码支付
        </p>

        <p className="text-[11px] text-muted-foreground mb-4">
          二维码有效时间：
          <span className="text-gold font-mono font-bold">{formatTime(timeLeft)}</span>
        </p>

        {orderInfo.isMock && (
          <button
            onClick={triggerMockSuccess}
            className="w-full max-w-[200px] h-9 rounded-lg bg-gold/10 border border-gold/30 hover:bg-gold/20 text-gold text-xs font-semibold transition active:scale-95 mb-4"
          >
            开发模式：模拟支付成功
          </button>
        )}

        <button
          onClick={onCancel}
          className="text-xs text-muted-foreground hover:text-bone transition"
        >
          取消并退回
        </button>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <div className="w-12 h-12 rounded-full border-2 border-gold glow-gold flex items-center justify-center mb-3">
          <Check className="text-gold animate-twinkle" size={28} />
        </div>
        <p className="font-display text-lg text-gold-gradient">供奉成功 · 正在解封天机</p>
        <p className="text-xs text-muted-foreground mt-1">天眼已开，契约缔结完成。</p>
      </div>
    );
  }

  if (state === "expired") {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <AlertTriangle className="text-destructive mb-3" size={32} />
        <p className="text-sm font-semibold text-bone">支付二维码已过期</p>
        <p className="text-xs text-muted-foreground mt-1 mb-4">请重新发起，契约生成有时效限制。</p>
        <div className="flex gap-2">
          <button
            onClick={() => handleStartPayment(payType)}
            className="h-8 px-4 rounded-lg bg-secondary/80 border border-gold/30 text-gold text-xs font-semibold"
          >
            重新生成
          </button>
          <button
            onClick={onCancel}
            className="h-8 px-4 rounded-lg bg-transparent text-muted-foreground text-xs"
          >
            取消退回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-8 text-center">
      <AlertTriangle className="text-destructive mb-3" size={32} />
      <p className="text-sm font-semibold text-bone">支付发起失败</p>
      <p className="text-xs text-destructive mt-1 mb-4">{errorMsg}</p>
      <button
        onClick={() => setState("idle")}
        className="h-8 px-4 rounded-lg bg-secondary/85 border border-gold/30 text-gold text-xs font-semibold"
      >
        返回重试
      </button>
    </div>
  );
}
