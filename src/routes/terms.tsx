import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  component: Terms,
});

function Terms() {
  return (
    <div className="min-h-screen bg-background text-bone p-6 md:p-12 max-w-3xl mx-auto space-y-6">
      <header className="border-b border-gold/20 pb-4">
        <Link to="/" className="text-xs text-gold hover:underline">
          ← 返回首页
        </Link>
        <h1 className="font-display text-2xl text-gold mt-2">用户服务协议</h1>
      </header>

      <section className="space-y-4 text-sm leading-relaxed">
        <p>欢迎使用戏命师。在使用本平台服务前，请您务必仔细阅读并理解本《用户服务协议》。</p>

        <h2 className="font-display text-lg text-gold mt-4">1. 服务内容与定位</h2>
        <p>
          本产品（戏命师）是一款基于人工智能（AI）的命理内容辅助展示、个人日常反思与娱乐交流工具。产品所生成的所有命理解读、流日分析、建议等内容，均为
          AI 模型基于算法推演生成的概率性描述与娱乐性文案，
          <strong>不构成任何医疗、心理诊断、法律、投资或专业决策建议</strong>。
        </p>

        <h2 className="font-display text-lg text-gold mt-4">2. 用户信息输入与授权</h2>
        <p>
          为了生成您的出生盘，您需要输入出生年月日时等非身份敏感的出生排盘数据。本平台承诺仅将此数据用于排盘算法计算以及戏命师对话上下文，绝不主动泄露、贩卖或用于其他未授权用途。
        </p>

        <h2 className="font-display text-lg text-gold mt-4">3. 账号恢复</h2>
        <p>
          平台采用无密码的恢复码机制。系统分配给您的恢复码（恢复密钥）是您重新登录和找回数据的唯一凭证，请务必妥善保管。因恢复码丢失导致的数据无法找回，由用户自行承担后果。
        </p>

        <h2 className="font-display text-lg text-gold mt-4">4. 协议修改</h2>
        <p>
          本平台保留在必要时修改本协议条款的权利。修改后的协议一经公布即生效，继续使用本服务即视为接受修改后的条款。
        </p>
      </section>
    </div>
  );
}
