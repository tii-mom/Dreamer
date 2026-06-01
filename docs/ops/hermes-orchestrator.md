# XMS Hermes Orchestrator 运维方案

## 目标

Dreamer 负责账户、命盘、盲盒、铭文、支付、订阅、市场和权益；腾讯云服务器上的 Hermes Agent 负责微信 Weixin/iLink 通道、用户会话、子 Agent 记忆、每日总结和生活助手能力。

不要继续使用旧的 `http://43.167.220.227/xms/wechat/bind` 绑定页。所有用户入口必须使用域名，例如 `https://bige.life/bind` 或平台统一的戏命师 Bot 二维码。

## 推荐服务器目录

```text
/opt/xms-hermes/
  core/
    SOUL.md
    SECURITY.md
    BUSINESS_RULES.md
    RESPONSE_STYLE.md
  skills/
    ziwei-reading/
    life-assistant/
    web-research/
    daily-summary/
    entitlement/
  users/
    shard-00/
    shard-01/
  bridge/
    xms-hermes-bridge
```

`docs/hermes/core/*` 和 `docs/hermes/skills/*` 是服务器侧模板。部署时同步到 `/opt/xms-hermes`。

## Dreamer API

所有 Hermes 到 Dreamer 的请求必须使用 HMAC 签名。

Headers:

```text
x-hermes-timestamp: unix seconds
x-hermes-nonce: random string
x-hermes-signature: hex hmac-sha256(timestamp + "." + nonce + "." + rawBody, HERMES_WEBHOOK_SECRET)
```

Endpoints:

```text
POST /api/hermes/weixin/bind
POST /api/hermes/weixin/message
POST /api/hermes/agent-state
POST /api/hermes/entitlement-check
POST /api/hermes/daily-summary
```

## 绑定流程

1. 用户打开 `https://bige.life/bind`。
2. Dreamer 生成绑定口令，例如 `绑定 ABC123`。
3. 用户扫码添加平台统一的戏命师 Weixin/iLink Bot。
4. 用户向 Bot 发送绑定口令。
5. Hermes 从入站消息取得 `providerUserId`。
6. Hermes 调用 `POST /api/hermes/weixin/message` 或 `POST /api/hermes/weixin/bind`。
7. Dreamer 绑定 `providerUserId -> userId`，创建 active master agent。
8. Hermes 把 Dreamer 返回的 `reply` 发回微信。

## 普通消息流程

Hermes 收到用户微信消息后，向 Dreamer 发送：

```json
{
  "provider": "weixin",
  "providerUserId": "sender-id-from-hermes",
  "text": "用户消息",
  "nickname": "optional",
  "avatarUrl": "optional",
  "rawPayload": {}
}
```

Dreamer 返回：

```json
{
  "ok": true,
  "userId": "usr_xxx",
  "reply": "戏命师回复",
  "entitlement": {},
  "agentState": {}
}
```

## 权限边界

普通用户不能拥有 Hermes 系统管理员权限。

必须禁止普通用户访问：

- terminal / shell / process
- server file read/write
- env/config/model key inspection
- Cloudflare / BufPay / DeepSeek / Nous / OpenRouter 配置
- 其他用户记忆

普通用户可用能力必须由 Dreamer 的 entitlement 决定。

## 每日记忆整理

Hermes 定时任务每天调用：

```text
POST /api/hermes/daily-summary
```

Dreamer 返回最近对话和建议写入路径。Hermes 只允许写入该用户自己的 `USER.md` / `MEMORY.md`，不得写入共享核心文档或其他用户目录。

## 规模化

MVP：1 台服务器、1 个 Hermes Gateway、1 个 Weixin/iLink Bot。

1,000+ 用户：拆分 bridge、memory store、queue 和监控。

10,000+ 用户：多个 Hermes shard，每个 shard 使用独立 Weixin/iLink Bot token；Dreamer 保存 `providerUserId -> shardId -> userId` 路由关系。

同一个 Weixin token 不应被多个 gateway 实例同时使用。
