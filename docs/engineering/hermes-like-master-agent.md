# Hermes-like Master Agent Runtime

Dreamer 的 MVP 主线采用 ClawBot webhook 直连 Dreamer，再由 Dreamer 内部的 Hermes-like Master Agent Runtime 生成戏命师回复。

## 1. 分层边界

```text
微信用户
  ↓
ClawBot / OpenClaw 微信通道
  ↓ webhook
Dreamer Worker
  ↓ providerUserId -> userId
Master Agent Runtime
  ↓ persona / skills / memory / chart / entitlement
DeepSeek
```

- ClawBot / OpenClaw 是微信消息通道层，只负责收消息、发消息、验签和 provider user id。
- Dreamer 是戏命师大脑层，负责用户、命盘、盲盒、铭文、经营者、权益和 Agent 编排。
- Hermes-like Master Agent 是 Dreamer 内部运行时，不要求用户自己部署 OpenClaw、Hermes 或独立 bot。

## 2. 10 万用户扩展方式

10 万用户不是 10 万个 OpenClaw 配置，也不是 10 万个 bot token。

平台使用一个或少量 ClawBot 微信入口，Dreamer 根据 `providerUserId` 找到 `userId`，再加载该用户的 active master agent。

每个用户拥有一个逻辑 Agent 实例：

```text
master_agents
master_agent_memories
master_agent_skill_states
```

这些记录承载戏命师的人设、技能、约束、记忆和权益状态。

## 3. MVP 主线

MVP 使用：

```text
POST /api/bot/clawbot/webhook
CLAWBOT_WEBHOOK_SECRET
```

MVP 不使用：

```text
OPENCLAW_BOT_TOKEN
clawbot-bridge 长轮询
腾讯云 pm2 常驻 Bridge
每用户独立 OpenClaw / Hermes 部署
```

Bridge 方案仅作为 webhook 不可用时的备用通道。

## 4. Agent 运行时职责

Master Agent Runtime 负责：

- 加载或创建用户 active master agent。
- 注入 persona、skills、constraints、memory policy。
- 合并用户出生资料和结构化紫微命盘摘要。
- 注入已装配铭文和经营者/付费权益。
- 将 Agent 上下文传给 DeepSeek prompt。
- 在后续版本沉淀关键事实和对话摘要。

## 5. 默认 Agent

首版默认 Agent 为「戏命师」，口吻是古风说书人、现代网络梗和克制毒舌。

安全约束：

- 不做医疗诊断。
- 不承诺投资、彩票、币种或具体金融收益。
- 不做政治动员。
- 不鼓励违法、骚扰、暴力、色情内容。
- 移动端回复默认控制在 3-5 句话。
