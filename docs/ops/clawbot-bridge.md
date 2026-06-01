# XMS ClawBot Bridge — 运维文档

> 当前状态：备用方案，不是 MVP 主线。
>
> MVP 采用 ClawBot webhook 直连 Dreamer：`POST /api/bot/clawbot/webhook`。这种模式不需要 `OPENCLAW_BOT_TOKEN`，也不需要腾讯云常驻 Bridge。Bridge 只在 ClawBot webhook 不可用、必须由服务器主动长轮询 iLink / OpenClaw 时启用。

## 1. 为什么需要 ClawBot Bridge

当 ClawBot webhook 可用时，不需要 Bridge。ClawBot 平台会主动把微信消息 POST 到 Dreamer Worker。

只有在 webhook 不可用、必须通过 OpenClaw / iLink 长轮询 `POST getupdates` 接收消息，再通过 `sendmessage` 回复时，才需要 Bridge。Cloudflare Workers 是无状态的边缘计算平台，不适合持久轮询，因此备用方案需要一台常驻服务器运行 Bridge。

因此需要一台常驻服务器（推荐腾讯云 CVM）运行 Bridge 进程，负责微信消息的收发。

## 2. 架构

MVP 主线：

```text
微信用户
  ↓
ClawBot / OpenClaw webhook
  ↓ POST /api/bot/clawbot/webhook
Dreamer Worker
  ↓ Master Agent Runtime
DeepSeek / 紫微排盘 / 支付 / 盲盒 / 经营者
```

备用 Bridge：

```text
微信用户 ↔ iLink / OpenClaw API
           ↓ POST getupdates (长轮询)
          clawbot-bridge (腾讯云 CVM)
           ↓ POST /api/bot/clawbot/ingest (HMAC 签名)
          Dreamer Worker
```

- Dreamer 主服务继续跑 Cloudflare Workers。
- Dreamer 内部 Hermes-like Master Agent Runtime 承载戏命师人设、技能、记忆、命盘和权益。
- Bridge 不包含任何戏命师业务逻辑，仅作为备用消息通道。

## 3. 当前 API Base

Bridge 使用环境变量 `OPENCLAW_API_BASE` 或 `config.local.json` 中的 `openclawApiBase` 指定 iLink / OpenClaw API 地址。

默认值：`https://ilink.weixin.qq.com`

修改方式：
```bash
export OPENCLAW_API_BASE=https://your-custom-api.example.com
```

或在 `config.local.json`：
```json
{
  "openclawApiBase": "https://your-custom-api.example.com"
}
```

## 4. 如何获取 OPENCLAW_BOT_TOKEN

1. 通过 OpenClaw 管理后台或扫码登录获取 bot token
2. Token 通常为 `sk-` 开头的长字符串
3. 配置到 `config.local.json`：
```json
{
  "openclaw": {
    "botToken": "sk-your-token-here"
  }
}
```
或设置环境变量：
```bash
export OPENCLAW_BOT_TOKEN="sk-your-token-here"
```

Token 不要提交到仓库。

## 5. 配置 DREAMER_API_BASE / DREAMER_BRIDGE_SECRET

```bash
# Dreamer Worker 端
wrangler secret put DREAMER_BRIDGE_SECRET
```

生成密钥：
```bash
openssl rand -hex 32
```

Bridge 端 `config.local.json`：
```json
{
  "dreamerApiBase": "https://bige.life",
  "dreamerBridgeSecret": "same-value-as-wrangler"
}
```

## 6. pm2 启动

```bash
cd clawbot-bridge
npm install
npm run build
pm2 start dist/index.js --name xms-clawbot-bridge
pm2 logs xms-clawbot-bridge
pm2 save
pm2 startup
```

重启：
```bash
pm2 restart xms-clawbot-bridge
```

## 7. systemd 启动

```ini
[Unit]
Description=XMS ClawBot Bridge
After=network.target

[Service]
WorkingDirectory=/opt/xms/clawbot-bridge
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=5
Environment=OPENCLAW_API_BASE=https://ilink.weixin.qq.com
Environment=DREAMER_API_BASE=https://bige.life
Environment=DREAMER_BRIDGE_SECRET=your-secret-here
Environment=OPENCLAW_BOT_TOKEN=your-token-here

[Install]
WantedBy=multi-user.target
```

## 8. Token 24h 到期手动续连

当前 MVP 版本 **不支持自动扫码续连**。Session 到期时需手动操作：

1. Bridge 日志在 `3h / 2h / 30min` 时会打印 warning/error 提醒
2. 看到日志提醒后：
   - 通过 OpenClaw 获取新 bot token
   - 更新 `OPENCLAW_BOT_TOKEN`（修改 `config.local.json` 或环境变量）
   - 重启 Bridge：`pm2 restart xms-clawbot-bridge`

自动扫码登录和 token 热替换计划在后续版本实现。

## 9. 验证真实微信消息收发

1. 启动 Bridge 后查看日志确认启动成功
2. 微信向 ClawBot 发送文本消息
3. Bridge 日志应显示 `Received message`
4. Dreamer 返回回复后，Bridge 日志显示 `sendMessage success`
5. 微信端收到回复

## 10. 查看日志

```bash
# pm2
pm2 logs xms-clawbot-bridge --lines 50

# systemd
journalctl -u xms-clawbot-bridge -n 50
```

日志不会输出 bot_token、bridge_secret 等敏感信息。

## 11. 已知限制

- **首版只支持文本消息**：图片/语音/文件会收到统一回复"戏命师目前先听文字"
- **不支持自动重连**：token 到期需人工获取新 token 并重启 Bridge
- **token 热替换未实现**：需 `pm2 restart`
- **Dreamer 主业务仍在 Cloudflare Workers**：不受 Bridge 影响

## 12. 常见错误

| 错误 | 原因 | 解决 |
|------|------|------|
| getupdates HTTP 401 | bot_token 过期 | 获取新 token 并重启 |
| sendmessage HTTP 200 但消息没投递 | context_token 过期或复用 | 确保使用当前消息的 context_token |
| Dreamer 401 | BRIDGE_SECRET 不匹配 | 检查两面 secret 一致，时间同步 |
| DeepSeek fallback | DeepSeek API 中断 | Dreamer Worker 自动返回预设 fallback |
| sendTyping 失败 | typing_ticket 无效 | 不影响主流程，仅 logging warning |

## 13. 配置优先级

```
环境变量 > config.local.json > config.example.json
```

所有关键配置（token、secret、api base）都支持三种方式配置。
