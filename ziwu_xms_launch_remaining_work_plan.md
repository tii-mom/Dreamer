# 紫微戏命师（Dreamer / xms-dialogue-game）公开上线剩余工作安排

版本：v1.0  
整理日期：2026-06-01  
目标：从「可演示 MVP」推进到「可公开上线、可真实收款、可处理用户问题」的最小可运营版本。  
上线口径：优先支持 **¥5.99 解封命盘** 与 **¥49.99 / 30 天月令订阅** 两个 SKU；暂缓真实盲盒交易、市场交易、命铺契约大额收费。

---

## 0. 当前判断

当前项目已经具备：

- 主聊天窗口与产品 UI 原型。
- Cloudflare Workers / TanStack Start 服务端结构。
- D1 / KV / R2 / Queue / Cron 的配置基础。
- 用户、会话、消息、每日状态、分享卡、出马申请等服务端数据结构。
- DeepSeek via Cloudflare AI Gateway 的对话接入与 fallback。
- 充值、订阅、盲盒、市场、解封等商业化入口的前端演示。

但距离公开收款运营仍有核心缺口：

- 真实支付订单系统未接入。
- 支付回调、验签、补单、幂等发权益未完成。
- 订阅只有 boolean 状态，没有有效期和续费逻辑。
- 盲盒、市场仍是 mock，暂不具备真实交易条件。
- 后台运营、补单、订单查询、用户查询缺失。
- 合规文案、退款规则、隐私协议、服务边界仍需补齐。
- 缺少上线前系统化 QA 与生产验收清单。

建议上线策略：

1. **先做轻付费上线**：只开放解封命盘与 30 天月令订阅。
2. **盲盒和市场先保留为运营预览/模拟体验**，不要真实收款和交易。
3. **出马赚钱功能先定位为服务菜单/报告生成工具**，避免承诺收益。
4. **支付闭环、后台补单、订阅到期、合规文案完成后再公开投流**。

---

## 1. 上线阶段划分

### M0：当前原型整理与冻结

目标：冻结当前 UI 和核心 MVP 范围，避免继续扩张玩法。

完成标准：

- [ ] 明确上线首版只卖 2 个 SKU：`seal_unlock`、`monthly_sub_30d`。
- [ ] 暂停真实盲盒、市场、命铺契约开发。
- [ ] 所有 mock 收款文案统一改为「内测演示」或在支付接入后替换。
- [ ] 确认生产域名、Cloudflare 资源、D1 数据库、R2、KV 均可用。
- [ ] 明确 BufPay 需要一台专用安卓设备常开。

建议工期：0.5～1 天。

---

### M1：真实支付与权益闭环

目标：用户可以扫码支付，系统可以安全确认订单并自动发放权益。

完成标准：

- [x] D1 有 `payments` 表。
- [x] 后端可以创建 BufPay 订单。
- [x] 前端可以展示支付宝/微信二维码。
- [x] 用户支付后 BufPay 回调 `/api/pay/callback`。
- [x] 后端完成 MD5 验签。
- [x] 后端校验订单归属、金额、aoid、状态。
- [x] 权益发放幂等：重复回调只发一次。
- [x] 前端轮询订单状态并刷新用户权益。
- [x] 本地无 BufPay credentials 时可以 mock 完整支付生命周期。
- [x] 支持手动补单。

建议工期：2～4 天。

---

### M2：订阅周期、后台运营与客服补单

目标：具备公开收款后的基础运营能力。

完成标准：

- [x] 用户表或订阅表记录订阅到期时间。
- [x] `monthly_sub_30d` 支付成功后延长 30 天。
- [x] 每次 bootstrap 时根据到期时间计算订阅状态。
- [x] 后台可查用户、订单、支付状态、权益状态。
- [x] 后台可手动补单、手动撤销或调整权益。
- [x] 订单异常、金额异常、重复回调、过期订单有日志。
- [ ] 有最小客服处理 SOP。

建议工期：2～3 天。

---

### M3：公开上线准备

目标：达到可以小规模公开访问、真实收款、可处理异常的水平。

完成标准：

- [ ] 生产环境 D1 migration 已远程执行。
- [ ] `BUFPAY_AID`、`BUFPAY_SECRET`、`DEEPSEEK_API_KEY` 等 secrets 已配置。
- [ ] 安卓收款手机已部署并完成支付宝/微信实付测试。
- [ ] 错误日志、支付日志、AI 调用日志可查看。
- [x] 服务协议、隐私政策、退款规则、命理/娱乐声明已上线。
- [x] 首页、弹窗、支付页没有「模拟支付」「暂不收款」等冲突文案。
- [ ] 通过上线 QA checklist。
- [ ] 小流量灰度，先邀请 20～100 个用户。

建议工期：1～2 天。

---

## 2. P0 工作包：支付系统

### 2.1 新增支付数据模型

新增 migration：

`migrations/0002_add_payments.sql`

建议表结构：

```sql
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  order_id TEXT NOT NULL UNIQUE,
  aoid TEXT UNIQUE,
  product_code TEXT NOT NULL,
  item_name TEXT NOT NULL,
  pay_type TEXT NOT NULL CHECK (pay_type IN ('alipay', 'wechat')),
  price_cents INTEGER NOT NULL,
  display_price TEXT NOT NULL,
  pay_price_cents INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  entitlement_applied INTEGER NOT NULL DEFAULT 0,
  qr TEXT,
  qr_img TEXT,
  qr_price TEXT,
  expires_at TEXT,
  callback_raw_json TEXT,
  provider_raw_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_user_status ON payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_aoid ON payments(aoid);
```

注意：

- 金额必须用 `price_cents INTEGER`，不要用 `REAL`。
- 权益发放必须通过 `entitlement_applied` 防重复。
- `callback_raw_json` 和 `provider_raw_json` 用于对账和排障。

验收：

- [ ] `wrangler d1 migrations apply xms-dialogue-game --local` 成功。
- [ ] `wrangler d1 migrations apply xms-dialogue-game --remote` 成功。
- [ ] D1 可查询到 `payments` 表和索引。

---

### 2.2 新增支付领域类型

建议在 `src/lib/domain.ts` 或独立 `src/lib/payment-domain.ts` 增加：

```ts
export type PayType = "alipay" | "wechat";

export type PaymentStatus =
  | "pending"
  | "new"
  | "payed"
  | "success"
  | "fee_error"
  | "expire"
  | "failed"
  | "mock_success";

export type ProductCode = "seal_unlock" | "monthly_sub_30d" | "qiyun_topup";
```

首版产品配置：

```ts
export const PRODUCTS = {
  seal_unlock: {
    code: "seal_unlock",
    name: "解封命盘",
    priceCents: 599,
  },
  monthly_sub_30d: {
    code: "monthly_sub_30d",
    name: "月令订阅 30 天",
    priceCents: 4999,
  },
} as const;
```

验收：

- [ ] 前端不能直接决定最终价格。
- [ ] 后端根据 `productCode` 白名单决定商品名和金额。
- [ ] 不允许前端传任意商品名或任意价格购买订阅/解封。

---

### 2.3 扩展 store helper

修改：

`src/lib/server/xms-store.server.ts`

新增能力：

- `createPaymentRecord(env, input)`
- `attachProviderPayment(env, orderId, providerPayload)`
- `getPaymentByOrderId(env, orderId)`
- `getPaymentByAoid(env, aoid)`
- `updatePaymentStatus(env, orderId, status, extra?)`
- `markPaymentEntitlementApplied(env, orderId)`

本地 DevStore 需要增加：

```ts
payments: Map<string, PaymentRecord>;
```

验收：

- [ ] D1 模式和无 D1 dev 模式都能跑。
- [ ] `markPaymentEntitlementApplied` 是原子/幂等逻辑。
- [ ] 重复调用不会重复加气运、重复订阅、重复解封。

---

### 2.4 新增 BufPay 服务层

建议新增：

`src/lib/server/xms-payment.server.ts`

负责：

- BufPay 创建订单。
- BufPay 查询订单.
- MD5 签名。
- 回调验签。
- Mock 支付。
- 权益发放。

创建订单逻辑：

1. `ensureSessionFromToken` 获取用户。
2. 校验 `productCode` 和 `payType`。
3. 后端生成 `orderId`。
4. 创建本地 pending 订单。
5. 如果没有 `BUFPAY_AID` / `BUFPAY_SECRET` 或 `BUFPAY_MOCK=true`，返回 mock 订单。
6. 如果 credentials 存在，请求 BufPay。
7. 保存 `aoid`、`qr`、`qr_img`、`expires_at`、原始响应。
8. 返回前端展示需要的字段。

BufPay 请求要求：

- `POST https://bufpay.com/api/pay/{aid}?format=json&expire=300&user_cache=true`
- `content-type: application/x-www-form-urlencoded`
- 签名顺序：

```text
name + pay_type + price + order_id + order_uid + notify_url + return_url + feedback_url + app_secret
```

回调验签顺序：

```text
aoid + order_id + order_uid + price + pay_price + app_secret
```

验收：

- [ ] 无 credentials 时，mock 支付完整可用。
- [ ] 有 credentials 时，可以创建真实 BufPay 订单。
- [ ] 签名结果与 BufPay 文档一致。
- [ ] 创建失败时，本地订单标记 failed，并返回可读错误。

---

### 2.5 修改 Worker 入口处理回调

修改：

`src/server.ts`

在交给 TanStack handler 前拦截：

```ts
if (url.pathname === "/api/pay/callback" && request.method === "POST") {
  return handleBufPayCallback(request, env);
}

if (url.pathname === "/api/pay/mock-success" && request.method === "POST") {
  return handleMockPaymentSuccess(request, env);
}
```

回调验收逻辑：

- [ ] 只接受 POST。
- [ ] 能解析 `application/x-www-form-urlencoded`。
- [ ] 校验必填字段：`aoid/order_id/order_uid/price/pay_price/sign`。
- [ ] 重新计算 MD5 并比对。
- [ ] 根据 `order_id` 查本地订单。
- [ ] 校验 `order_uid === payment.userId`。
- [ ] 校验 `aoid === payment.aoid`。
- [ ] 校验金额一致。
- [ ] 标记订单 success。
- [ ] 幂等发放权益。
- [ ] 重复回调返回 200，但不重复发权益。

---

### 2.6 新增 server functions

修改：

`src/lib/api/xms.functions.ts`

新增：

- `createPaymentOrder`
- `queryPaymentStatus`
- `mockPaySuccess`（也可以走普通 fetch 到 `/api/pay/mock-success`）

输入校验：

```ts
z.object({
  productCode: z.enum(["seal_unlock", "monthly_sub_30d"]),
  payType: z.enum(["alipay", "wechat"]),
});
```

状态查询：

```ts
z.object({
  orderId: z.string().min(1),
});
```

验收：

- [ ] 未登录用户自动创建 session 后可下单。
- [ ] 只能查询自己的订单。
- [ ] 查询不存在或别人的订单不会泄漏信息。
- [ ] 支付成功后返回最新权益摘要。

---

### 2.7 前端支付组件

新增：

`src/components/PaymentPanel.tsx`

功能：

- 商品信息展示。
- 支付渠道选择：支付宝 / 微信。
- 创建订单按钮。
- 展示二维码图片 `qr_img`。
- 无 `qr_img` 时展示 `qr` 并生成二维码，或提示复制链接。
- 倒计时 5 分钟。
- 每 3 秒轮询 `queryPaymentStatus`。
- 支付成功动画。
- Mock 模式显示「开发模式：模拟支付成功」。
- 过期后允许重新生成订单。

验收：

- [ ] 支付中关闭弹窗不会造成轮询泄漏。
- [ ] 支付成功后停止轮询。
- [ ] 支付成功后刷新 `xms-bootstrap`。
- [ ] 过期订单不会继续显示可支付状态。
- [ ] 移动端二维码清晰可扫。

---

### 2.8 替换现有模拟支付入口

修改：

- `src/components/Modals.tsx`
- `src/components/ChatWindow.tsx`
- `src/routes/index.tsx`

首版替换范围：

- `SealModal`：接入 `seal_unlock`。
- `SubModal`：接入 `monthly_sub_30d`。
- `TopupModal`：可以先只保留 `seal_unlock` 和 `monthly_sub_30d`，自定义金额暂缓。

文案替换：

- 删除「暂不收款 · 模拟解封」。
- 删除「首版不收款」。
- 删除「模拟支付，不扣真钱」。
- 如果处于 mock 模式，只在开发环境显示 mock 标识。

验收：

- [ ] 生产环境用户看不到 mock 文案。
- [ ] 解封支付成功后 `sealUnlocked = 100`，`chartGlow = 100`。
- [ ] 订阅支付成功后订阅有效期增加 30 天。
- [ ] 前端状态与后端 bootstrap 一致。

---

## 3. P0 工作包：权益与订阅

### 3.1 新增订阅字段

新增 migration：

`migrations/0003_add_subscription_fields.sql`

建议：

```sql
ALTER TABLE users ADD COLUMN subscribed_until TEXT;
ALTER TABLE users ADD COLUMN subscription_plan TEXT;
```

如果 SQLite 不允许重复执行，需要写兼容脚本或确认 migration 只执行一次。

验收：

- [ ] 新用户字段为空时不报错。
- [ ] 旧用户 bootstrap 不报错。
- [ ] TypeScript 类型同步更新。

---

### 3.2 订阅状态计算

不要只依赖 `subscribed` boolean。建议：

- `subscribed_until > now` 时，视为有效订阅。
- `asksMax` 对订阅用户提升到至少 3。
- 过期用户自动恢复免费权益。

支付成功逻辑：

- 如果用户当前未订阅或已过期：从当前时间延长 30 天。
- 如果用户当前仍有效：从 `subscribed_until` 再延长 30 天。

验收：

- [ ] 新购订阅有效。
- [ ] 续费会叠加 30 天。
- [ ] 过期后 bootstrap 显示未订阅。
- [ ] 免费用户每日问事限制仍生效。

---

### 3.3 权益发放函数

新增统一函数：

```ts
applyPaymentEntitlement(env, payment);
```

规则：

- `seal_unlock`：
  - `sealUnlocked = 100`
  - `chartGlow = 100`
- `monthly_sub_30d`：
  - `subscription_plan = monthly_sub_30d`
  - `subscribed_until += 30 days`
  - `asksMax = max(asksMax, 3)`
  - `chartGlow = max(chartGlow, 80)`
- `qiyun_topup`：暂缓，或只在后续版本开放。

验收：

- [ ] 同一订单重复回调只发一次。
- [ ] 不同订单可以正常叠加订阅周期。
- [ ] 权益发放有 event log。
- [ ] 权益失败时订单不要误标记已发放。

---

## 4. P1 工作包：后台运营最小版

### 4.1 后台访问方式

首版可以不做完整后台 UI，但必须有一种安全方式能处理订单。

可选方案：

1. Cloudflare protected admin route。
2. 简单 `/admin` 页面 + 管理员 token。
3. 暂时使用 D1 查询 + 内部脚本，但上线前至少要有补单脚本。

建议最低交付：

- `src/routes/admin.tsx` 或 `/api/admin/*`。
- `ADMIN_TOKEN` secret。
- 所有 admin API 要校验 token。

---

### 4.2 后台功能

必须有：

- [ ] 按订单号查询 payment。
- [ ] 按用户 ID 查询用户。
- [ ] 查看订单状态、金额、商品、回调内容。
- [ ] 手动将订单标记 success 并发权益。
- [ ] 手动撤销/调整用户权益。
- [ ] 查看最近异常订单。

可以后置：

- [ ] 用户列表分页。
- [ ] AI 调用成本统计。
- [ ] 盲盒概率配置。
- [ ] 市场资产管理。

验收：

- [ ] 无 token 无法访问。
- [ ] 错误 token 无法访问。
- [ ] 手动补单也走同一套幂等发权益函数。
- [ ] 所有 admin 操作写入 event log。

---

## 5. P1 工作包：合规、文案与服务边界

### 5.1 必备页面

新增：

- `/terms` 用户协议。
- `/privacy` 隐私政策。
- `/refund` 退款规则。
- `/disclaimer` 命理娱乐声明。

必写内容：

- 本产品为娱乐、内容与个人反思工具，不提供医疗、法律、投资、心理诊断等专业建议。
- 命理内容不保证结果。
- 虚拟商品支付后权益即时发放，退款规则需明确。
- 用户输入的出生信息、聊天内容如何使用和保存。
- AI 生成内容可能不准确。
- 未成年人使用限制。

验收：

- [ ] 支付前能看到退款/服务说明入口。
- [ ] 首页 footer 或设置页有协议入口。
- [ ] 支付弹窗有简短声明。
- [ ] 出马赚钱文案不承诺收益。

---

### 5.2 风险文案替换

需要避免：

- “稳赚”
- “保证赚钱”
- “自动接单躺赚”
- “改命保证有效”
- “投资建议”
- “医疗诊断”
- “情感操控/挽回保证”

建议替换为：

- “生成服务菜单”
- “生成报告草稿”
- “辅助你整理表达”
- “娱乐参考”
- “不构成专业建议”

验收：

- [ ] 全仓搜索风险词并处理。
- [ ] 支付页、订阅页、出马页、分享页都无收益承诺。
- [ ] AI system prompt 与前端文案保持一致。

---

## 6. P1 工作包：监控、日志与异常处理

### 6.1 支付日志

所有支付关键节点写 event：

- `payment_created`
- `payment_create_failed`
- `payment_callback_received`
- `payment_signature_invalid`
- `payment_amount_mismatch`
- `payment_success`
- `payment_entitlement_applied`
- `payment_duplicate_callback`
- `payment_expired`
- `payment_manual_repair`

验收：

- [ ] 每个订单能从 event 还原状态变化。
- [ ] 异常订单有足够信息排查。

---

### 6.2 AI 与系统异常

已有 `ai_call_logs` 基础。继续补：

- [ ] DeepSeek 调用失败率。
- [ ] fallback 次数。
- [ ] 用户发送消息失败次数。
- [ ] SSR 500 错误日志。
- [ ] D1 写入失败日志。

验收：

- [ ] 生产环境出错时能定位是 AI、DB、支付还是前端。
- [ ] 不把 secret 打进日志。

---

## 7. P2 工作包：盲盒与市场后置方案

公开轻付费版上线前，盲盒和市场不建议真实收费。

### 7.1 盲盒真实化前置条件

需要完成：

- [ ] `blindbox_draws` 表。
- [ ] `user_assets` 表。
- [ ] 概率配置版本化。
- [ ] 每次抽卡记录随机种子/结果/概率版本。
- [ ] 抽中资产进入用户资产。
- [ ] 概率公示页面。
- [ ] 未成年人和消费提醒。
- [ ] 退款/争议处理规则。

未完成前：

- 只能叫“模拟抽卡”。
- 不能真实收费。
- 不能声称资产可交易变现。

---

### 7.2 市场真实化前置条件

需要完成：

- [ ] `market_listings` 表。
- [ ] `market_orders` 表.
- [ ] 资产冻结与解冻。
- [ ] 成交记录。
- [ ] 手续费规则。
- [ ] 价格异常风控。
- [ ] 虚假交易/刷单处理。
- [ ] 用户资产争议处理。

未完成前：

- 只能保留“运营预览”。
- 不允许用户真实买卖。
- 不要显示会误导的真实成交额。

---

## 8. P0 / P1 上线 QA Checklist

### 8.1 本地基础检查

```bash
npm install
npm run lint
npm run build
npm run db:migrate:local
```

通过标准：

- [ ] lint 通过。
- [ ] build 通过。
- [ ] 本地 migration 通过。
- [ ] 本地无 BufPay credentials 时 mock 支付可跑通。

---

### 8.2 支付 mock 测试

测试用例：

- [ ] 创建解封订单。
- [ ] mock 支付成功。
- [ ] 用户 `sealUnlocked = 100`。
- [ ] 重复 mock success 不重复发权益。
- [ ] 创建订阅订单。
- [ ] mock 支付成功。
- [ ] `subscribed_until` 增加 30 天。
- [ ] 续费再次增加 30 天。
- [ ] 查询别人的订单失败。
- [ ] 订单过期后不能成功发权益。

---

### 8.3 BufPay 真实支付测试

前置：

- 安卓手机安装 BufPay App。
- 手机登录收款微信/支付宝。
- 开启通知读取权限。
- 关闭省电和后台清理。
- 手机常联网、常充电。
- BufPay 后台已配置二维码。
- Worker 生产域名 HTTPS 可访问。

测试用例：

- [ ] 支付宝 ¥5.99 解封成功。
- [ ] 微信 ¥5.99 解封成功。
- [ ] 支付宝 ¥49.99 订阅成功。
- [ ] 微信 ¥49.99 订阅成功。
- [ ] 订单回调签名正确。
- [ ] 错误签名不发权益。
- [ ] 金额不一致不发权益。
- [ ] 重复回调不重复发权益。
- [ ] 手机断网时订单不会误成功。
- [ ] 手机恢复后能处理后续订单。

---

### 8.4 前端体验测试

- [ ] 首页可打开。
- [ ] 新用户自动创建 session。
- [ ] 恢复码文案正常。
- [ ] 用户能发送消息。
- [ ] AI 正常时回复正常。
- [ ] AI key 缺失时 fallback 正常。
- [ ] 解封弹窗支付流程正常。
- [ ] 订阅弹窗支付流程正常。
- [ ] 支付成功后界面权益刷新。
- [ ] 移动端适配正常。
- [ ] 关闭弹窗不会造成轮询泄漏。
- [ ] 支付过期提示清晰。
- [ ] 没有 mock/暂不收款文案残留。

---

### 8.5 生产发布检查

```bash
npm run build
npm run db:migrate:remote
wrangler secret put BUFPAY_AID
wrangler secret put BUFPAY_SECRET
wrangler secret put DEEPSEEK_API_KEY
wrangler deploy
```

通过标准：

- [ ] 生产域名访问正常。
- [ ] D1 远程 migration 已执行。
- [ ] KV session 正常。
- [ ] R2 分享卡正常。
- [ ] DeepSeek 正常或 fallback 正常。
- [ ] BufPay 回调地址公网可访问。
- [ ] 支付实测成功。
- [ ] 后台可补单。
- [ ] 协议页面可访问。

---

## 9. 给开发线程的执行顺序

建议严格按以下顺序推进，避免并行引入太多不可控问题。

### 第 1 批：支付数据库与后端基础

- [x] 创建 `0002_add_payments.sql`。
- [x] 增加 payment domain types。
- [x] 扩展 `xms-store.server.ts` payment helpers。
- [x] 新增 `xms-payment.server.ts`。
- [x] 新增 MD5 工具。
- [x] 新增 mock payment flow。

交付验收：

- 本地 mock 可以创建订单、查询订单、mock 成功、发权益。

---

### 第 2 批：BufPay 真实接入

- [x] 实现 BufPay create order。
- [x] 实现 BufPay callback verify。
- [x] 修改 `server.ts` 拦截 `/api/pay/callback`。
- [x] 实现订单状态查询。
- [x] 加支付 event log。

交付验收：

- 可用 curl 模拟正确/错误签名。
- 可用真实 BufPay 创建二维码。

---

### 第 3 批：前端支付 UI

- [x] 新增 `PaymentPanel.tsx`。
- [x] 改 `SealModal`。
- [x] 改 `SubModal`。
- [x] 改 `TopupModal` 或暂时隐藏复杂充值项。
- [x] 改 `index.tsx` 接入 mutations。
- [x] 支付成功后 invalidate bootstrap。

交付验收：

- 用户可从 UI 完成 mock 支付和真实支付。

---

### 第 4 批：订阅周期

- [x] 新增订阅字段 migration。
- [x] 更新 user domain type。
- [x] 更新 mapUser / updateUser。
- [x] 实现 `subscribed_until` 计算。
- [x] 更新前端显示。

交付验收：

- 订阅购买、续费、过期都正确。

---

### 第 5 批：后台补单

- [x] 新增 admin token。
- [x] 新增订单查询。
- [x] 新增用户查询。
- [x] 新增手动补单。
- [x] 新增 admin event log。

交付验收：

- 真实掉单可以人工处理。

---

### 第 6 批：上线文案与合规

- [x] 新增 terms/privacy/refund/disclaimer。
- [x] 替换风险文案。
- [x] 删除生产 mock文案。
- [x] 出马赚钱改为服务菜单/报告工具定位。

交付验收：

- 可以公开给用户访问，不会明显误导。

---

### 第 7 批：最终 QA 与灰度

- [ ] 全量 checklist。
- [ ] 真实小额支付。
- [ ] 灰度 20～100 人。
- [ ] 收集支付失败、AI 失败、转化数据。

交付验收：

- 连续 24 小时无重大支付/登录/白屏问题。

---

## 10. 后续验收方式

每次开发线程完成一个批次后，提交以下材料：

1. GitHub PR 链接或分支名。
2. 改动摘要。
3. 涉及文件列表。
4. 本地执行结果：`npm run lint`、`npm run build`、migration 结果。
5. 自测截图或日志。
6. 支付相关批次必须提供订单号、回调日志、D1 查询结果。

验收时按以下维度检查：

- 是否符合本计划的范围。
- 是否有越权或安全漏洞。
- 是否支持本地 mock 与生产真实支付双路径。
- 是否有幂等处理。
- 是否有异常日志。
- 是否有用户可理解的错误提示。
- 是否没有把 secret 暴露到前端或日志。
- 是否不会破坏已有聊天、签到、分享卡功能。

验收结论格式：

```text
验收结论：通过 / 有条件通过 / 不通过

必须修复：
1. ...
2. ...

建议优化：
1. ...
2. ...

可进入下一批：是 / 否
```

---

## 11. 当前最重要的决策

上线前请先确认：

- [ ] 是否确定首版只卖 `¥5.99 解封命盘` 和 `¥49.99 30 天订阅`？
- [ ] 是否已准备专用安卓手机运行 BufPay App？
- [ ] 是否接受盲盒和市场首版只展示不真实交易？
- [ ] 是否需要我后续按 PR 分批验收？

建议答案：

- 是，只卖两个低风险 SKU。
- 是，准备安卓机。
- 是，盲盒/市场后置。
- 是，按工作包分批验收。

---

## 12. 一句话执行原则

先把 **支付可信、权益准确、后台能补、文案合规** 做完，再谈盲盒、市场和大额商业化。
