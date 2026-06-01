import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { verifyTicket, createPaymentOrder, queryPaymentStatus } from "@/lib/api/xms.functions";
import { Sparkles } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({
  ticket: z.string().optional(),
  productCode: z.string().optional(),
});

export const Route = createFileRoute("/wx/pay")({
  validateSearch: searchSchema,
  component: WxPay,
});

function WxPay() {
  const { ticket, productCode } = Route.useSearch();
  const [qrImg, setQrImg] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [orderId, setOrderId] = useState("");
  const [status, setStatus] = useState<"creating" | "qr" | "success" | "failed">("creating");
  const [errorMsg, setErrorMsg] = useState("");

  const { data: auth } = useQuery({
    queryKey: ["wx-ticket", ticket],
    queryFn: () => verifyTicket({ data: { ticket: ticket ?? "" } }),
    enabled: !!ticket,
  });

  useEffect(() => {
    if (!auth?.valid || !productCode) return;

    const validCodes = [
      "seal_unlock",
      "operator_899",
      "blindbox_single",
      "blindbox_ten",
      "qiyun_topup",
    ] as const;
    type ValidCode = (typeof validCodes)[number];
    if (!validCodes.includes(productCode as ValidCode)) {
      setStatus("failed");
      setErrorMsg("无效商品");
      return;
    }

    (async () => {
      try {
        const res = await createPaymentOrder({
          data: {
            productCode: productCode as ValidCode,
            payType: "wechat",
          },
        });
        if (res?.status === "ok") {
          setQrImg(res.qrImg ?? null);
          setPrice(res.price);
          setOrderId(res.orderId);
          setStatus("qr");

          // Poll for payment
          const pollInterval = setInterval(async () => {
            try {
              const pollRes = await queryPaymentStatus({
                data: { orderId: res.orderId },
              });
              if (pollRes.status === "success" || pollRes.status === "mock_success") {
                clearInterval(pollInterval);
                setStatus("success");
              }
            } catch {
              // ignore poll errors
            }
          }, 3000);

          // Cleanup
          return () => clearInterval(pollInterval);
        } else {
          throw new Error("创建订单失败");
        }
      } catch (err) {
        setStatus("failed");
        setErrorMsg(err instanceof Error ? err.message : "请求失败");
      }
    })();
  }, [auth, productCode]);

  if (!ticket || !auth?.valid) {
    return (
      <div className="min-h-screen bg-background text-bone flex flex-col items-center justify-center px-6 text-center">
        <Sparkles size={36} className="text-gold mb-4" />
        <h1 className="font-display text-lg text-gold mb-2">请从微信内打开</h1>
        <p className="text-xs text-muted-foreground max-w-xs">
          此页面需要通过戏命师微信机器人发送的链接访问
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-bone px-4 py-6 max-w-lg mx-auto">
      {status === "creating" && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xs text-muted-foreground">正在生成支付...</p>
        </div>
      )}

      {status === "qr" && qrImg && (
        <div className="flex flex-col items-center py-10 text-center">
          <img src={qrImg} alt="支付二维码" className="w-52 h-52 object-contain mb-4" />
          <div className="font-display text-2xl text-gold mb-2">¥{price}</div>
          <p className="text-xs text-muted-foreground">请使用微信扫码支付</p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="font-display text-lg text-gold mb-2">支付成功</h2>
          <p className="text-xs text-muted-foreground">天机已开，契约缔结完成</p>
        </div>
      )}

      {status === "failed" && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="font-display text-lg text-gold mb-2">支付失败</h2>
          <p className="text-xs text-destructive">{errorMsg}</p>
        </div>
      )}
    </div>
  );
}
