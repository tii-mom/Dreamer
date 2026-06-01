import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  component: Privacy,
});

function Privacy() {
  return (
    <div className="min-h-screen bg-background text-bone p-6 md:p-12 max-w-3xl mx-auto space-y-6">
      <header className="border-b border-gold/20 pb-4">
        <Link to="/" className="text-xs text-gold hover:underline">
          ← 返回首页
        </Link>
        <h1 className="font-display text-2xl text-gold mt-2">隐私政策</h1>
      </header>

      <section className="space-y-4 text-sm leading-relaxed">
        <p>
          我们非常重视您的隐私。本《隐私政策》向您说明我们如何收集、使用及保护您的个人相关数据。
        </p>

        <h2 className="font-display text-lg text-gold mt-4">1. 我们收集的信息</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>排盘数据</strong>：您主动输入的出生日期、时间、性别及阳历/阴历类型。
          </li>
          <li>
            <strong>对话内容</strong>：您与 AI 戏命师沟通的文字记录，用于辅助上下文理解。
          </li>
          <li>
            <strong>设备与访问日志</strong>：为了保障交易安全和防御恶意刷单，系统会收集您的访问
            IP、浏览器 UserAgent。
          </li>
        </ul>

        <h2 className="font-display text-lg text-gold mt-4">2. 信息的使用与分享</h2>
        <p>
          收集的信息仅用于在您当前的会话中生成八字报告、AI 对话交互及进行必要的 BufPay
          订单校验。我们不会将您的任何出生盘或对话数据分享或出售给第三方广告机构。
        </p>

        <h2 className="font-display text-lg text-gold mt-4">3. 敏感数据安全</h2>
        <p>
          我们不对外保存或索要您的真实姓名、身份证号、银行账号或手机号。微信和支付宝的扫码付款通过
          BufPay 协议直接到达收款钱包，我们不收集也不存储您的银行卡或微信/支付宝账户密码。
        </p>
      </section>
    </div>
  );
}
