import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldAlert, CheckCircle, AlertCircle } from "lucide-react";

type PaymentDetails = {
  id?: string;
  userId?: string;
  user_id?: string;
  productCode?: string;
  product_code?: string;
  displayPrice?: string;
  display_price?: string;
  status?: string;
  entitlementApplied?: boolean;
  entitlement_applied?: number;
  createdAt?: string;
  created_at?: string;
};

export const Route = createFileRoute("/admin")({
  component: AdminPanel,
});

function AdminPanel() {
  const [token, setToken] = useState("");
  const [orderId, setOrderId] = useState("");
  const [paymentData, setPaymentData] = useState<PaymentDetails | null>(null);
  const [logMsg, setLogMsg] = useState("");
  const [errLink, setErrLink] = useState("");

  const handleQueryOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogMsg("");
    setErrLink("");
    try {
      const res = await fetch(`/api/admin/order?orderId=${orderId}&token=${token}`);
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      setPaymentData(data);
    } catch (err: unknown) {
      setErrLink(err instanceof Error ? err.message : "查询失败");
      setPaymentData(null);
    }
  };

  const handleRepairOrder = async () => {
    if (!orderId) return;
    setLogMsg("");
    setErrLink("");
    try {
      const res = await fetch(`/api/admin/repair`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId }),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      setLogMsg(data.message || "补单成功！");
      // Re-query
      const queryRes = await fetch(`/api/admin/order?orderId=${orderId}&token=${token}`);
      if (queryRes.ok) {
        setPaymentData(await queryRes.json());
      }
    } catch (err: unknown) {
      setErrLink(err instanceof Error ? err.message : "补单失败");
    }
  };

  return (
    <div className="min-h-screen bg-background text-bone p-6 md:p-12 max-w-4xl mx-auto space-y-8 flex flex-col justify-center">
      <header className="border-b border-gold/20 pb-4">
        <Link to="/" className="text-xs text-gold hover:underline">
          ← 返回首页
        </Link>
        <h1 className="font-display text-3xl text-gold mt-1">天命掌柜 · 后台管理</h1>
        <p className="text-xs text-muted-foreground">查询订单状态、手动为掉单用户进行权益补发。</p>
      </header>

      {/* Admin Token Form */}
      <section className="glass p-5 rounded-2xl border border-gold/10 space-y-3">
        <div className="text-xs text-muted-foreground">请输入管理员鉴权 Token：</div>
        <input
          type="password"
          placeholder="ADMIN_TOKEN"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="w-full h-10 px-3 rounded-xl bg-secondary/60 border border-gold/20 text-xs text-bone outline-none focus-visible:ring-1 focus-visible:ring-gold"
        />
      </section>

      {/* Order Operations */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-2xl border border-gold/10 space-y-4">
          <h3 className="text-sm font-semibold text-gold">订单手动补单</h3>
          <form onSubmit={handleQueryOrder} className="space-y-3">
            <div className="text-xs text-muted-foreground">输入待处理订单号 (orderId)：</div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="例如: pay_xxxxxx"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="flex-1 h-10 px-3 rounded-xl bg-secondary/60 border border-gold/20 text-xs text-bone outline-none"
              />
              <button
                type="submit"
                className="h-10 px-4 rounded-xl ritual-btn text-xs font-semibold"
              >
                查询订单
              </button>
            </div>
          </form>

          {errLink && (
            <div className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle size={14} />
              <span>{errLink}</span>
            </div>
          )}

          {logMsg && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle size={14} />
              <span>{logMsg}</span>
            </div>
          )}

          {paymentData && (
            <div className="pt-2">
              <button
                onClick={handleRepairOrder}
                className="w-full h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/30"
              >
                一键强制补发权益
              </button>
            </div>
          )}
        </div>

        {/* Order Details Output */}
        <div className="glass p-6 rounded-2xl border border-gold/10 space-y-3 min-h-[200px] flex flex-col">
          <h3 className="text-sm font-semibold text-gold">订单详情数据</h3>
          {paymentData ? (
            <div className="flex-1 bg-black/40 border border-gold/5 rounded-xl p-3.5 space-y-2 text-xs font-mono text-muted-foreground overflow-y-auto max-h-[220px]">
              <div>
                <strong>ID:</strong> {paymentData.id}
              </div>
              <div>
                <strong>用户ID:</strong> {paymentData.userId || paymentData.user_id}
              </div>
              <div>
                <strong>商品编码:</strong> {paymentData.productCode || paymentData.product_code}
              </div>
              <div>
                <strong>订单金额:</strong> ¥{paymentData.displayPrice || paymentData.display_price}
              </div>
              <div>
                <strong>当前状态:</strong>{" "}
                <span className="text-gold font-semibold">{paymentData.status}</span>
              </div>
              <div>
                <strong>已发权益:</strong>{" "}
                {paymentData.entitlementApplied || paymentData.entitlement_applied === 1
                  ? "是"
                  : "否"}
              </div>
              <div>
                <strong>创建时间:</strong> {paymentData.createdAt || paymentData.created_at}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground/40 italic">
              暂无查询数据
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
