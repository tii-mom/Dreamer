# Dreamer MVP 上线任务文档：ClawBot Webhook + Hermes-like 戏命师 Agent

## 目标

让 Dreamer / 紫微戏命师完成 MVP 上线：

```text
用户快速绑定微信 ClawBot
→ 每个用户拥有自己的 active 戏命师 Agent
→ 微信里可聊天、绑定、起盘、看菜单、生成前世反差身份卡、进入盲盒/铭文/经营者 H5
→ Dreamer 内部 Hermes-like Master Agent Runtime 负责人设、技能、记忆、命盘和权益
```

MVP 主线明确采用：

```text
ClawBot webhook → Dreamer Worker → Master Agent Runtime → DeepSeek
```

MVP 不采用：

```text
腾讯云 clawbot-bridge
OPENCLAW_BOT_TOKEN
OpenClaw getupdates 长轮询
每用户独立 OpenClaw / Hermes 部署
```

## 1. 当前代码状态

当前本地已完成：

- 新增 `docs/engineering/hermes-like-master-agent.md`
- 更新 `docs/ops/clawbot-bridge.md`，Bridge 标记为备用方案
- 更新 `docs/launch/next-release-verification.md`
- 新增 `migrations/0009_add_master_agents.sql`
- 新增 `src/lib/agents/master-agent-presets.ts`
- 新增 `src/lib/server/xms-master-agent.server.ts`
- `handleBotMessage` 默认聊天链路已加载 active master agent
- `generateMasterReply` 已注入 agent persona / skills / constraints / memories
- 本地 `npm run build` 通过
- 本地 `npm run db:migrate:local` 通过

必须纳入本轮 MVP 上线范围的既有产品文档：

- `前世反差身份卡_内容策划文档.md`
- `MVP前世反差身份卡_开发任务文档.md`

注意：

- 生产 `wrangler deploy` 尚未完成。
- 远程 D1 migration 尚未执行。
- `bige.life/api/bot/clawbot/ingest` 之前仍是 404，但它不再是 MVP 主线。
- 主线入口应是 `https://bige.life/api/bot/clawbot/webhook`。

## 2. 上线前必须完成

### 2.1 整理工作区

检查当前工作区：

```bash
cd /Users/yudeyou/Desktop/Dreamer/xms-dialogue-game
git status --short
```

注意不要误删或恢复用户已有改动。当前可能存在与本任务无关的文件：

```text
ziwu_xms_launch_remaining_work_plan.md
MVP前世反差身份卡_开发任务文档.md
前世反差身份卡_内容策划文档.md
clawbot-bridge/deploy.sh
```

只处理本 MVP 上线相关文件，不要擅自清理无关文件。

### 2.2 代码质量检查

执行：

```bash
npm install
npm run build
```

如果 build 失败，优先修复类型、SSR 打包和 Cloudflare Worker 兼容问题。

可选执行：

```bash
npm run lint
```

如果 lint 发现大量历史问题，只修复本任务引入的问题，不做大范围格式化。

### 2.3 远程 D1 migration

先确认 migration 列表包含：

```text
migrations/0009_add_master_agents.sql
前世反差身份卡实现后，还应包含 migrations/0010_add_past_life_results.sql
```

然后执行远程 D1 migration：

```bash
wrangler d1 migrations apply xms-dialogue-game --remote
```

验收：

- `0009_add_master_agents.sql` 显示成功
- 远程 D1 存在：
  - `master_agents`
  - `master_agent_memories`
  - `master_agent_skill_states`
  - `past_life_results`（前世反差身份卡实现后）

### 2.4 Cloudflare Worker 生产部署

执行：

```bash
npm run build
npx wrangler deploy
```

如果 asset upload 卡住：

- 不要重复开多个 deploy 进程。
- 先检查并停止本项目残留 deploy 进程。
- 可尝试使用项目本地新版 Wrangler：

```bash
npx wrangler@4.95.0 deploy
```

验收：

```bash
curl -i https://bige.life/api/bot/clawbot/webhook
```

允许返回 `400` 或 `401`，但不应返回旧站点 HTML `404`。

## 3. 生产环境变量

生产必须确认：

```text
CLAWBOT_WEBHOOK_SECRET
DEEPSEEK_API_KEY
CF_ACCOUNT_ID
CF_AI_GATEWAY_ID
BUFPAY_AID
BUFPAY_SECRET
APP_BASE_URL=https://bige.life
```

生产不需要：

```text
OPENCLAW_BOT_TOKEN
```

生产不要启用：

```text
BUFPAY_MOCK=true
CLAWBOT_MOCK=true
```

如需设置 ClawBot webhook secret：

```bash
wrangler secret put CLAWBOT_WEBHOOK_SECRET
```

ClawBot 后台签名密钥必须与 `CLAWBOT_WEBHOOK_SECRET` 一致。

## 4. ClawBot 后台配置

在 ClawBot 管理后台配置：

```text
Webhook URL: https://bige.life/api/bot/clawbot/webhook
签名密钥: 与 CLAWBOT_WEBHOOK_SECRET 一致
```

请求格式需兼容当前 handler：

```json
{
  "provider_user_id": "微信用户唯一 ID",
  "content": "用户发送的文本"
}
```

或：

```json
{
  "from": "微信用户唯一 ID",
  "text": "用户发送的文本"
}
```

签名请求头：

```text
x-clawbot-timestamp: <unix_timestamp_seconds>
x-clawbot-nonce: <random_nonce>
x-clawbot-signature: <hmac_sha256_hex>
```

签名原文：

```text
timestamp + "." + nonce + "." + rawBody
```

算法：

```text
HMAC-SHA256(payload, CLAWBOT_WEBHOOK_SECRET)
```

## 5. Master Agent Lite 验收

### 5.1 默认 Agent 自动创建

触发任意普通聊天消息后，检查 D1：

```sql
SELECT id, owner_user_id, agent_code, display_name, status
FROM master_agents
ORDER BY created_at DESC
LIMIT 10;
```

预期：

```text
agent_code = xms_default
display_name = 戏命师
status = active
每个触发聊天的 user 有 active agent
```

### 5.2 Agent prompt 注入

用真实微信发送普通问题，例如：

```text
我最近事业怎么走？
```

预期：

- 回复仍是戏命师口吻。
- 不暴露 “system prompt / agent config / DeepSeek” 等内部字样。
- DeepSeek fallback 时仍能返回可用回复。
- 没有 birth chart 时会引导补全出生资料，不假装已完整排盘。

### 5.3 命盘上下文注入

发送：

```text
1995-06-15 22:00 女
```

预期：

- 保存 birth profile
- 生成或更新 `birth_charts`
- 回复依据结构化紫微命盘摘要
- 不编造摘要里没有的星曜、宫位、四化、格局

### 5.4 缺时辰引导

发送：

```text
1995-06-15 女
```

预期：

- 保存 birth profile
- 不生成完整 birth chart
- 提示用户补出生时辰

## 6. 前世反差身份卡 MVP

前世反差身份卡是 MVP 的传播转化闭环，不是后续可选项。实现必须遵循：

- 固定 72 个身份池，不在运行时调用 LLM 生成身份。
- 身份结果必须由结构化紫微命盘字段推导，不能纯随机。
- 不使用 AI 图片生成，不生成真人图，不引入重资源。
- 分享卡使用 SVG 模板，MVP 可用固定背景、动态文字和二维码/短链接。
- 不展示完整生日、真实姓名、手机号、微信 ID、providerUserId。
- 页面底部必须标注：`娱乐互动内容，不构成现实判断。`
- 不宣称“真实前世事实”，统一使用“戏命师翻旧账式娱乐判词”。

### 6.1 内容池

新增：

```text
src/lib/share/past-life-presets.ts
```

必须包含 `前世反差身份卡_内容策划文档.md` 中的 72 个身份，结构至少包含：

```ts
type PastLifePreset = {
  id: string;
  camp: "power" | "wealth" | "love" | "jianghu" | "immortal" | "underworld";
  rarity: "normal" | "rare" | "epic" | "legendary";
  title: string;
  rank: string;
  keywords: string[];
  triggerHint: string;
  shortText: string;
  shareText: string;
};
```

### 6.2 结果服务

新增：

```text
src/lib/server/xms-past-life.server.ts
```

必须支持：

- `resolvePastLifeFromChart(chart)`：根据命盘决定阵营、稀有度、身份和命盘依据。
- `getOrCreatePastLifeResult(env, userId)`：同一用户同一命盘稳定复用结果。
- `getPastLifeResultByShareToken(env, shareToken)`：分享页读取公开结果。
- `buildPastLifeShareText(result)`：ClawBot 文案。
- `buildPastLifeShareSvg(result, options)`：SVG 分享卡。

匹配算法必须至少读取：

```text
命宫、财帛宫、官禄宫、夫妻宫、福德宫、迁移宫、主星、四化、煞星、格局 patterns、出生资料安全字段 hash
```

阵营评分要求：

```text
power: 紫微 / 天府 / 天相 / 天梁 / 化权 / 官禄强
wealth: 武曲 / 天府 / 太阴 / 禄存 / 化禄 / 财帛强
love: 贪狼 / 廉贞 / 红鸾 / 天喜 / 夫妻宫强
jianghu: 七杀 / 破军 / 火星 / 铃星 / 迁移宫强
immortal: 天机 / 天梁 / 文昌 / 文曲 / 化科 / 福德强
underworld: 巨门 / 化忌 / 煞忌交织 / 旧账主题
```

同一命盘必须稳定返回同一身份；稀有度展示使用“命格池约 X%”，上线前不要写“全站仅 X%”。

### 6.3 数据库

新增 migration：

```text
migrations/0010_add_past_life_results.sql
```

如果已有 0010，则使用下一个序号。表结构：

```sql
CREATE TABLE IF NOT EXISTS past_life_results (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  chart_id TEXT,
  preset_id TEXT NOT NULL,
  title TEXT NOT NULL,
  rarity TEXT NOT NULL,
  result_json TEXT NOT NULL,
  share_token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_past_life_results_user_id ON past_life_results(user_id);
CREATE INDEX IF NOT EXISTS idx_past_life_results_share_token ON past_life_results(share_token);
CREATE INDEX IF NOT EXISTS idx_past_life_results_preset_id ON past_life_results(preset_id);
CREATE INDEX IF NOT EXISTS idx_past_life_results_rarity ON past_life_results(rarity);
```

`DevStore` 需新增：

```ts
pastLifeResults: Map<string, Record<string, unknown>>;
```

### 6.4 API 和页面

新增 server functions：

```text
src/lib/api/past-life.functions.ts
```

导出：

```text
createPastLifeResult
queryPastLifeResult
```

新增 SVG endpoint：

```text
GET /api/share/past-life-card/:shareToken.svg
```

返回：

```text
Content-Type: image/svg+xml; charset=utf-8
Cache-Control: public, max-age=3600
```

新增页面：

```text
src/routes/past-life.tsx
src/routes/past-life.share.$shareToken.tsx
src/routes/wx.past-life.tsx
```

页面验收：

- `/past-life`：已有完整命盘可生成卡；缺命盘引导补出生年月日时。
- `/past-life/share/$shareToken`：好友可查看公开身份卡并继续测自己的。
- `/wx/past-life`：通过 ClawBot ticket 识别绑定用户，展示或生成身份卡。

### 6.5 ClawBot 命令

修改 `src/lib/server/xms-bot.server.ts`，支持：

```text
前世
前世身份
生成分享卡
```

完整命盘时返回：

```text
我给你翻了一页旧账。

你的前世身份是：「{{title}}」
稀有度：{{rarityLabel}}｜{{rarityPercent}}

{{shortText}}

点这里生成分享卡：
{{url}}
```

缺时辰时返回：

```text
想看前世身份，不能只给年月日。
把出生年月日时补全，例如：
1995-06-15 22:00 女

缺时辰，我只能看见你前世的影子，看不见你当时到底是掌柜还是背锅侠。
```

经营者用户分享链接优先使用：

```text
/s/:referralCode?scene=past-life&share=<shareToken>
```

普通用户使用：

```text
/past-life/share/:shareToken
```

### 6.6 前世身份卡验收

必须验证：

- 有完整 `birth_charts` 的用户可生成 `PastLifeResult`。
- 同一用户重复生成结果稳定。
- 缺时辰用户被引导补时辰。
- `/api/share/past-life-card/:token.svg` 可访问。
- SVG 不泄露生日、姓名、providerUserId。
- `/past-life` 页面可打开并复制分享链接。
- `/past-life/share/:token` 页面可打开。
- ClawBot 输入“前世”能返回结果和分享链接。
- 经营者分享链接保留 referralCode。
- 不调用 DeepSeek 生成身份。
- 不调用图片生成模型。
- 卡片文案包含娱乐边界，不构成现实判断。

## 7. 微信端完整冒烟测试

### 7.1 菜单

微信发送：

```text
菜单
```

预期：

- 返回戏命师菜单
- `bot_messages` 写入 in/out
- 无 Worker 500

### 7.2 绑定

打开：

```text
https://bige.life/bind
```

网页生成绑定码后，微信发送：

```text
绑定 XXXXXX
```

预期：

- `bot_bind_tickets`: `pending → bound`
- `wechat_bindings` 写入 `provider_user_id`
- 网页显示绑定成功
- 微信回复绑定成功

### 7.3 普通聊天

微信发送：

```text
我最近感情怎么处理？
```

预期：

- 自动创建或加载 active master agent
- 回复为戏命师风格
- `bot_messages` 记录 in/out

### 7.4 前世身份卡

微信发送：

```text
前世
```

预期：

- 完整命盘用户返回前世身份、稀有度、毒舌判词和分享链接。
- 缺时辰用户返回补时辰引导。
- `past_life_results` 写入或复用稳定结果。
- 分享链接可打开，且不泄露隐私。

### 7.5 盲盒入口

微信发送：

```text
盲盒
```

预期：

- 返回 `/wx/blindbox?ticket=...`
- ticket 可打开
- ticket 10 分钟过期、一次性

### 7.6 铭文入口

微信发送：

```text
铭文
```

预期：

- 返回 `/wx/assets?ticket=...`
- 可查看和管理铭文装配
- 已装配铭文能注入 AI prompt

### 7.7 经营者入口

微信发送：

```text
命铺
```

预期：

- 返回 `/wx/operator?ticket=...`
- 可进入经营者页面

## 8. 数据库检查

联调后检查：

```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM wechat_bindings;
SELECT COUNT(*) FROM bot_bind_tickets;
SELECT COUNT(*) FROM bot_messages;
SELECT COUNT(*) FROM birth_charts;
SELECT COUNT(*) FROM master_agents;
SELECT COUNT(*) FROM past_life_results;
```

抽样检查：

```sql
SELECT owner_user_id, agent_code, display_name, status, created_at
FROM master_agents
ORDER BY created_at DESC
LIMIT 20;
```

```sql
SELECT user_id, preset_id, title, rarity, share_token, created_at
FROM past_life_results
ORDER BY created_at DESC
LIMIT 20;
```

## 9. 回滚方案

如果 Master Agent Runtime 出问题：

- 不回滚数据库 migration。
- 临时改代码让 `generateMasterReply` 不传 `masterAgent` / `agentMemories`。
- 保留 webhook、绑定、菜单、命盘、盲盒等主流程。

如果 ClawBot webhook 出问题：

- 优先检查 `CLAWBOT_WEBHOOK_SECRET` 是否一致。
- 检查 timestamp 是否在 5 分钟窗口内。
- 检查 nonce 是否重复。
- 检查 ClawBot 请求体字段是 `provider_user_id/content` 还是 `from/text`。

Bridge 只作为最后备用，不作为 MVP 默认回滚路径。

如果前世反差身份卡出问题：

- 不回滚 `past_life_results` migration。
- 临时隐藏 `/past-life` 入口和 ClawBot “前世”命令。
- 保留起盘、普通聊天、绑定、盲盒和 Master Agent 主流程。

## 10. 完成后交付格式

请在完成后回复：

```text
MVP 上线联调完成:

部署:
Worker deploy:
Remote D1 migration:
APP_BASE_URL:

ClawBot:
Webhook URL:
CLAWBOT_WEBHOOK_SECRET:
签名测试:

Master Agent:
master_agents:
默认 agent 创建:
Agent prompt 注入:

前世反差身份卡:
past_life_results:
72 身份池:
命盘推导稳定性:
SVG endpoint:
/past-life:
/past-life/share:
/wx/past-life:
ClawBot 前世命令:
隐私与娱乐边界:

真实微信测试:
菜单:
绑定:
普通聊天:
完整出生起盘:
缺时辰引导:
前世身份卡:
盲盒入口:
铭文入口:
经营者入口:

D1 检查:
users:
wechat_bindings:
bot_bind_tickets:
bot_messages:
birth_charts:
master_agents:
past_life_results:

已知问题:
下一步建议:
```
