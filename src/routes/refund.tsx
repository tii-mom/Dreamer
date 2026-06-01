import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/refund")({
  component: Refund,
});

function Refund() {
  return (
    <div className="min-h-screen bg-background text-bone p-6 md:p-12 max-w-3xl mx-auto space-y-6">
      <header className="border-b border-gold/20 pb-4">
        <Link to="/" className="text-xs text-gold hover:underline">
          ← 返回首页
        </Link>
        <h1 className="font-display text-2xl text-gold mt-2">退款规则</h1>
      </header>

      <section className="space-y-4 text-sm leading-relaxed">
        <p>感谢您选择戏命师服务。请在购买前仔细阅读本《退款规则》。</p>

        <h2 className="font-display text-lg text-gold mt-4">1. 虚拟商品的性质</h2>
        <p>
          戏命师提供的服务（包括但不限于“解封命盘”与“月令订阅”）均为数字化虚拟商品，包含即时生效的
          AI 算力消耗及平台特定功能权限解锁。
          <strong>一旦支付成功，对应的虚拟权益即刻绑定至您的账户并生效。</strong>
        </p>

        <h2 className="font-display text-lg text-gold mt-4">2. 退款政策</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>不支持无理由退款</strong>
            ：鉴于数字化虚拟商品的即时消费性，本平台所有付费项目在支付完成后均不支持无理由退款。
          </li>
          <li>
            <strong>系统异常补偿</strong>
            ：若发生支付扣款成功但系统因故障未能正确发放权益的情形，请通过首页反馈入口联系客服，提供订单号及付款证明。经后台核实无误后，我们将优先为您进行手动补单；若因不可抗力导致无法完成补单，我们将为您办理全额退款。
          </li>
        </ul>

        <h2 className="font-display text-lg text-gold mt-4">3. 异常交易处理</h2>
        <p>
          如有任何重复付款或由于网络延迟导致的多扣款项，请联系客服处理，核实后我们将对多扣除的款项按原支付路径原路退回。
        </p>
      </section>
    </div>
  );
}
