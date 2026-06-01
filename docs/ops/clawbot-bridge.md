# XMS ClawBot Bridge — 运维文档

## 1. 为什么需要 ClawBot Bridge

ClawBot (OpenClaw) 的微信消息通道需要常驻进程通过长轮询 `getupdates` 接收消息，再通过 `sendmessage` 回复。Cloudflare Workers 是无状态的边缘计算平台，不支持常驻的长轮询连接。

因此需要一台常驻服务器（如腾讯云 CVM）运行 Bridge 进程，负责微信消息的收发。

## 2. 架构

```
微信用户 ↔ OpenClaw API ↔ clawbot-bridge (腾讯云) ↔ Dreamer Worker (Cloudflare)
```

- Dreamer 主服务继续跑 Cloudflare Workers（无状态、全球边缘）
- Bridge 只跑腾讯云（长连接、状态保持）
- Bridge 不包含任何业务逻辑（DeepSeek / 紫微 / 支付 / 盲盒）

## 3. 配置 DREAMER_API_BASE

生产环境：`https://bige.life`

本地调试可指向 `http://127.0.0.1:8080`。

## 4. 配置 DREAMER_BRIDGE_SECRET

生成方式：
```bash
openssl rand -hex 32
```

**Bridge 端**：写入 `config.local.json` 或设置环境变量 `DREAMER_BRIDGE_SECRET`。

**Dreamer 端**：设置为 wrangler secret：
```bash
wrangler secret put DREAMER_BRIDGE_SECRET
```

两边必须一致。

## 5. 配置 OPENCLAW_BOT_TOKEN

Bot token 通过 OpenClaw / ClawBot 扫码登录后获取。

**方式 1**：环境变量
```bash
export OPENCLAW_BOT_TOKEN="sk-..."
```

**方式 2**：`config.local.json`
```json
{
  "openclaw": {
    "botToken": "sk-..."
  }
}
```

Token 不要提交到仓库。

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

创建 `/etc/systemd/system/xms-clawbot-bridge.service`：

```ini
[Unit]
Description=XMS ClawBot Bridge
After=network.target

[Service]
WorkingDirectory=/opt/xms/clawbot-bridge
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=5
Environment=DREAMER_API_BASE=https://bige.life
Environment=DREAMER_BRIDGE_SECRET=your-secret-here
Environment=OPENCLAW_BOT_TOKEN=your-token-here

[Install]
WantedBy=multi-user.target
```

启动：
```bash
systemctl daemon-reload
systemctl enable xms-clawbot-bridge
systemctl start xms-clawbot-bridge
journalctl -u xms-clawbot-bridge -f
```

## 8. 查看日志

```bash
# pm2
pm2 logs xms-clawbot-bridge --lines 50

# systemd
journalctl -u xms-clawbot-bridge -n 50
```

日志格式：
```
[2026-06-01T12:00:00.000Z] [INFO] Bridge starting
[2026-06-01T12:00:01.000Z] [INFO] Received message {...}
[2026-06-01T12:00:02.000Z] [INFO] Dreamer ingest: reply received {...}
```

## 9. 24 小时重连

OpenClaw session 默认 24 小时过期。Bridge 会：

- 剩余 2 小时时打印 WARNING 日志
- 剩余 30 分钟时打印 ERROR 日志

收到提醒后：
1. 重新扫码登录获取新 token
2. 更新 `OPENCLAW_BOT_TOKEN`
3. 重启 Bridge：`pm2 restart xms-clawbot-bridge`

## 10. 常见错误

### HTTP 200 但消息没投递
通常是 `context_token` 过期或复用。Bridge 使用当前收到消息的 `context_token`，不使用旧 token。

### context_token 复用
`sendmessage` 的 `context_token` 必须取当前消息的 `context_token`。不能复用之前其他消息的 token。

### bot_token 过期
表现为 `getupdates` 返回 401。需要重新获取 bot token。

### Dreamer 401
Bridge 签名验证失败。检查两端 `DREAMER_BRIDGE_SECRET` 是否一致，时间是否同步。

### DeepSeek fallback
当 DeepSeek API 调用失败时，Dreamer Worker 会返回预设的 fallback 回复。这不是 Bridge 的问题。

## 11. 配置检查清单

- [ ] DREAMER_API_BASE 是否正确
- [ ] DREAMER_BRIDGE_SECRET 两面一致
- [ ] OPENCLAW_BOT_TOKEN 有效
- [ ] Bridge 能 ping 通 Dreamer API
- [ ] wrangler secret 已部署 DREAMER_BRIDGE_SECRET
- [ ] Bridge 日志显示正常启动
- [ ] 微信发消息 Bridge 能收到
- [ ] Dreamer 返回回复后微信能收到
