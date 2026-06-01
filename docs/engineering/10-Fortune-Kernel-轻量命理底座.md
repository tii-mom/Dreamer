# Fortune Kernel 轻量命理底座

## 目标

Dreamer 不换 Cloudflare Workers / TypeScript 架构。命理计算优先走本地规则，DeepSeek 只负责戏命师口吻表达。

## 底座判断

当前 `src/lib/ziwei` 已经是基于 `iztro` 与 `lunar-javascript` 的结构化封装，和 `Renhuai123/ziwei-doushu` 的核心方向一致。因此不做完全替换，而是在现有底座上升级：

- 保留 `src/lib/ziwei/algorithm.ts` 的排盘逻辑。
- 保留 `src/lib/ziwei/patterns.ts` 的格局识别。
- 新增 `src/lib/fortune`，把紫微、黄历、星座入口与保存结果统一起来。
- 后续如继续参考 `Renhuai123/ziwei-doushu` 的结构化知识库，需要保留 MIT attribution。

## 模型策略

所有 DeepSeek 场景统一使用：

```txt
DEEPSEEK_CHAT_MODEL=deepseek-v4-flash
```

不再区分 chat/report 模型。报告可以提高 `max_tokens`，但不得切到 pro 模型。

## 微信输出策略

ClawBot 对话框只输出短回复：

- 一句话结论
- 关键摘要
- HTML 报告链接
- 已保存提示

长文报告统一保存为 HTML，用户通过 `/r/:resultId` 阅读。微信里不要直接输出大段文字。

## 保存策略

新增 `fortune_results` 与 `fortune_daily_cache`：

- 命盘
- 今日流日
- 每日问事
- 命盘解封
- 星座入口
- 出马订单报告
- 分享卡

都应自动保存，用户可在 `/history` 回看。

## P0/P1/P2/P3

P0：flash 模型统一、Fortune Kernel 类型、HTML 报告工具、保存表。

P1：每日流日接入 FortuneSignal，每日问事按 topic 选择信号，命盘解封保存 HTML。

P2：星座轻量入口，出马订单报告最小闭环。

P3：西方本命盘、合盘、市场与技能卡增强。
