import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/disclaimer")({
  component: Disclaimer,
});

function Disclaimer() {
  return (
    <div className="min-h-screen bg-background text-bone p-6 md:p-12 max-w-3xl mx-auto space-y-6">
      <header className="border-b border-gold/20 pb-4">
        <Link to="/" className="text-xs text-gold hover:underline">
          ← 返回首页
        </Link>
        <h1 className="font-display text-2xl text-gold mt-2">免责与娱乐声明</h1>
      </header>

      <section className="space-y-4 text-sm leading-relaxed">
        <h2 className="font-display text-lg text-gold mt-4">1. 娱乐与反思定位</h2>
        <p>
          戏命师（本平台）所提供的传统排盘推演、八字分析、流日分析及戏命师对话互动等所有内容，均基于
          AI 大语言模型算法与传统命理学排盘规则生成。所有解读及建议仅作为
          <strong>日常反思、文学欣赏与娱乐交流使用</strong>
          ，绝不代表确定的客观事实或对未来的绝对预测。
        </p>

        <h2 className="font-display text-lg text-gold mt-4">2. 专业建议免责</h2>
        <p>
          本平台生成的所有内容
          <strong>
            均不构成任何医疗诊断、心理咨询、法律合规、财务投资、职业规划或任何形式的专业决策建议
          </strong>
          。若您面临重大的身体健康、心理情绪、财产纠纷或投资决策问题，请务必寻求相关领域的专业资质人士或权威机构的指导。因参考本平台内容而做出的任何决策，其后果由用户自行承担，平台不承担任何连带法律责任。
        </p>

        <h2 className="font-display text-lg text-gold mt-4">3. 技术局限性说明</h2>
        <p>
          AI
          生成的内容可能会出现偏差、事实性错误或不准确的推演。由于传统命理学流派众多，解析维度多样，解读结果仅供参考，不保证其准确性、完整性或时效性。
        </p>
      </section>
    </div>
  );
}
