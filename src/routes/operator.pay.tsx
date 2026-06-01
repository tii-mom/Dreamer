import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PaymentPanel } from "@/components/PaymentPanel";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/operator/pay")({
  component: OperatorPay,
});

function OperatorPay() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handlePaymentSuccess = () => {
    // Invalidate session cache
    queryClient.invalidateQueries({ queryKey: ["xms-bootstrap"] });
    queryClient.invalidateQueries({ queryKey: ["operator-status"] });
    // Go to dashboard
    navigate({ to: "/operator/dashboard" });
  };

  return (
    <div className="min-h-screen bg-background text-bone flex flex-col justify-center items-center p-6">
      <div className="max-w-md w-full glass p-8 rounded-3xl border border-gold/15 space-y-6 text-center shadow-2xl relative overflow-hidden">
        <header className="space-y-1">
          <Link to="/operator" className="text-xs text-gold hover:underline">
            ← 返回上一页
          </Link>
          <h1 className="font-display text-2xl text-gold mt-2">开通命铺经营权</h1>
          <p className="text-xs text-muted-foreground">
            扫码支付 ¥899.00，即可开启专属微信命理推广服务
          </p>
        </header>

        <section className="bg-secondary/20 rounded-2xl border border-gold/10 p-4">
          <PaymentPanel
            productCode="operator_899"
            onSuccess={handlePaymentSuccess}
            onCancel={() => navigate({ to: "/operator" })}
          />
        </section>

        <footer className="text-[10px] text-muted-foreground/60 leading-relaxed text-left">
          *
          提示：虚拟版权经营权开通即时生效，本平台不提供“保证回本”及任何额外投资担保。请理性做出消费决策。
        </footer>
      </div>
    </div>
  );
}
