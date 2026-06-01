# Next Release Verification Document

## 1. 本轮完成的 PR 列表

| PR | 标题 | 链接 | 分支 |
|----|------|------|------|
| #1 | P0: stabilize database and core bindings | https://github.com/tii-mom/Dreamer/pull/1 | pr0-stabilize-database-core |
| #2 | P1: add clawbot ticket and wx h5 routes | https://github.com/tii-mom/Dreamer/pull/2 | pr1-clawbot-ticket-wx-routes |
| #3 | P2: harden payment and replace mock pay flows | https://github.com/tii-mom/Dreamer/pull/3 | pr2-harden-payment-remove-mock |
| #4 | P3: complete operator referral loop | https://github.com/tii-mom/Dreamer/pull/4 | pr3-operator-referral-loop |
| #5 | P4: complete blindbox and rune asset loop | https://github.com/tii-mom/Dreamer/pull/5 | pr4-blindbox-rune-asset-loop |
| #6 | P5: finish art integration and mobile performance | https://github.com/tii-mom/Dreamer/pull/6 | pr5-art-integration-mobile |

## 2. 每个 PR 的核心改动

### PR 0 — 稳定性、数据库和核心类型修复
- `createUser` 支持可选参数 `{ id?, nickname?, source? }`，修复 ClawBot 绑定错配
- 统一商品注册表 `src/lib/products.ts`，消除 `xms-service` 和 `xms-payment` 重复定义
- `ProductCode` 类型清理：移除 `monthly_sub`、`monthly_sub_30d`、`shop_contract`
- 支付原子化幂等：`markPaymentEntitlementApplied` 先行原子锁 → 重复 callback 不重复发权益
- BufPay callback 加固：aoid 校验、终态订单跳过、`callback_raw_json` 持久化
- D1 migration 0006：新增 `bot_tickets` 表

### PR 1 — ClawBot 安全、命令系统和 H5 ticket
- HMAC-SHA256 签名：timestamp 验证（5 分钟窗口）、nonce 去重（5 分钟 TTL）、常量时间对比
- Bot Action Manifest 系统：`actions.ts` + `command-parser.ts` + `render-menu.ts`
- 数字菜单：60 秒有效期，普通用户和经营者不同菜单
- Bot Ticket：10 分钟过期、一次性、不可伪造
- 所有 Bot 链接从 `?uid=xxx` 改为 `/wx/xxx?ticket=xxx`
- 5 个 H5 路由：`/wx/home`、`/wx/blindbox`、`/wx/assets`、`/wx/operator`、`/wx/pay`

### PR 2 — 支付系统加固，替换 mock 支付入口
- SealModal：从"模拟解封"改为真实 PaymentPanel
- TopupModal：从"模拟支付，不扣真钱"改为商品网格 + PaymentPanel
- ChatWindow：移除"暂不收款 · 模拟解封"、"模拟单抽"等文案
- bind.tsx：移除"模拟绑定"文案
- mock 支付守卫加固：仅 `BUFPAY_MOCK=true` 且非生产环境可用
- 支付成功后 invalidate 所有相关 cache

### PR 3 — 经营者归因闭环
- `/s/:refCode` 落地页：operator 查询、访问记录、引导绑定微信
- Dashboard 增强：风险状态、活动明细（访问/转化/流水/香火值）
- 合规文案：移除"永久归因"，替换为平台活动权益说明

### PR 4 — 盲盒与铭文资产闭环
- Asset Catalog：8 种铭文，4 档稀有度（normal/rare/epic/legendary），概率分档，drawWeight
- 独立抽奖引擎：`xms-blindbox-draw.server.ts`，十连保底史诗
- 支付权益使用新抽奖系统
- 结果页：`/blindbox/result/$drawId` + `/wx/result/$drawId`
- 装配铭文注入 AI prompt context，影响 Bot 回复风格

### PR 5 — 美术资源接入和移动端性能
- 审计 439 资产 → 构建 286 派生资产 → manifest 86 条
- 首页首屏：5 请求 / 12KB（预算：≤5 / ≤300KB）✅
- 盲盒首屏：319KB（预算：≤800KB）✅
- 所有图片通过 AssetImage / manifest URL 加载
- 无散写 `/assets/` 路径

## 3. 数据库 migration 列表

| Migration | 文件 | 状态 |
|-----------|------|------|
| 0001 | `migrations/0001_initial_operating_mvp.sql` | 初始表结构 |
| 0002 | `migrations/0002_add_payments.sql` | payments 表 |
| 0003 | `migrations/0003_add_subscription_fields.sql` | users 扩展字段 |
| 0004 | `migrations/0004_wechat_operator_tables.sql` | 微信/经营者/资产/盲盒表 |
| 0005 | `migrations/0005_fix_payments_referral_fields.sql` | payments 扩展字段 |
| 0006 | `migrations/0006_add_bot_tickets.sql` | bot_tickets 表（新增） |

## 4. 新增环境变量列表

| 变量 | 说明 | 必填 |
|------|------|------|
| `CLAWBOT_WEBHOOK_SECRET` | ClawBot webhook HMAC-SHA256 密钥 | 生产是 |
| `CLAWBOT_MOCK` | 设为 `true` 绕过 webhook 签名验证（仅本地） | 否 |
| `BUFPAY_AID` | BufPay 商户 ID | 生产是 |
| `BUFPAY_SECRET` | BufPay 密钥 | 生产是 |
| `BUFPAY_MOCK` | 设为 `true` 启用模拟支付（仅非生产） | 否 |
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | 是 |
| `ADMIN_TOKEN` | 后台管理 token | 推荐 |

## 5. 本地运行方式

```bash
cd xms-dialogue-game
cp .env.example .env       # 填写必要环境变量
npm install
npm run db:migrate:local    # 初始化 D1 数据库
npm run dev                 # 启动开发服务器 (http://localhost:8080)
```

## 6. Cloudflare 部署方式

```bash
npm run build               # 构建客户端 + 服务端
npm run db:migrate:remote   # 应用到远程 D1 数据库
npx wrangler deploy         # 部署到 Cloudflare Workers
```

## 7. BufPay 配置方式

1. 在 [BufPay](https://bufpay.com) 注册商户
2. 获取 `BUFPAY_AID` 和 `BUFPAY_SECRET`
3. 设置回调 URL：`https://bige.life/api/pay/callback`
4. 设置 return URL：`https://bige.life/?pay_return={order_id}`
5. 在 Cloudflare dashboard 或 `.dev.vars` 中设置环境变量

本地测试可设置 `BUFPAY_MOCK=true` 使用模拟支付。

## 8. ClawBot webhook 配置方式

1. 在 ClawBot 管理后台设置 webhook URL：`https://bige.life/api/bot/clawbot/webhook`
2. 设置签名密钥与 `CLAWBOT_WEBHOOK_SECRET` 一致
3. webhook 请求格式：

```json
{
  "provider_user_id": "微信用户唯一 ID",
  "content": "用户发送的消息文本"
}
```

4. 请求头要求：

```
x-clawbot-timestamp: <unix_timestamp_seconds>
x-clawbot-nonce: <random_nonce>
x-clawbot-signature: <hmac_sha256_hex>
```

签名原文：`timestamp + "." + nonce + "." + rawBody`
签名算法：`HMAC-SHA256(payload, CLAWBOT_WEBHOOK_SECRET)`

## 9. 测试账号

| 角色 | provider_user_id | 说明 |
|------|------------------|------|
| 测试用户 | `test_user_001` | 普通用户，用于测试绑定/盲盒/支付 |
| 测试经营者 | `test_operator_001` | 先支付 operator_899 激活，再测试推广归因 |

## 10. 测试订单号

| 订单号 | 商品 | 状态 |
|--------|------|------|
| `pay_<random>` | seal_unlock (¥5.99) | 通过 mock 支付测试 |
| `pay_<random>` | operator_899 (¥899) | 通过 mock 支付测试 |
| `pay_<random>` | blindbox_single (¥99) | 通过 mock 支付测试 |
| `pay_<random>` | blindbox_ten (¥888) | 通过 mock 支付测试 |

## 11. 测试经营者 referralCode

经营者在支付 operator_899 后自动生成 `ref_<random>` 格式的 referral code。
可通过 `GET /api/admin/order?orderId=<order_id>&token=<admin_token>` 查询。

## 12. 已知问题

1. **盲盒结果页导航**：支付成功后自动跳转到结果页需要 drawId 从后端回传，当前尚未完全打通。用户需手动刷新盲盒页面查看最新记录。
2. **SubModal**：月订阅功能已从首版 ProductCode 移除，SubModal 保留为占位 UI，点击"加入候补"无实际操作。
3. **Bot 命令中未覆盖的命令**：`love`、`money`、`work`、`draw`、`earnings` 等 intent 已定义但部分回复内容为简化版本。
4. **铭文装配影响 Bot 回复**：已装配铭文的 effect 注入 AI prompt，但未对 fallback 回复层做差异化处理。
5. **Ticket 内存会话**：数字菜单的 60 秒有效期使用 in-memory Map，worker 冷启动或水平扩展时可能失效。

## 13. 仍未完成的后续事项

1. 盲盒支付成功 → 自动跳转结果页（需 PaymentPanel 回调带回 drawId）
2. 月订阅功能完善（`monthly_sub` 作为未来 SKU）
3. 经营者提现功能（首版不涉及真实现金返佣）
4. 铭文市场交易（首版不做复杂市场）
5. 多级分销（首版不做）
6. 真实微信扫描二维码绑定流程（当前使用 Provider ID 模拟）
7. 微信内 H5 分享卡片自动生成
8. 盲盒开盒动画优化（序列帧仅在微信内加载）
9. 经营者 D1 数据最近访问记录明细查询 API
10. Cron 定时任务（当前为占位）
