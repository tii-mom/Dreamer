# 紫微戏命师新版上线剩余工作安排：微信机器人 / 经营者 / 盲盒铭文版

> 版本：v2.0  
> 日期：2026-06-01  
> 项目：`tii-mom/Dreamer`  
> 核心定位：微信里的戏命师机器人 + 899 经营者命铺网络 + 盲盒 / 铭文经济  
> 本文档用于替换上一版“网页站内付费运营”上线计划。

---

## 0. 结论：上一版计划是否需要调整？

需要调整，而且是战略级调整。

上一版计划的默认核心是：

```text
网页聊天窗口
→ 用户站内问命
→ 支付 ¥5.99 解封 / ¥49.99 订阅
→ 盲盒、市场、分享卡作为后续增强
```

现在确认后的真实核心是：

```text
用户绑定微信 / ClawBot
→ 戏命师成为用户微信里的机器人
→ 用户在微信里和戏命师对话、抽签、玩盲盒
→ 899 付费成为经营者
→ 经营者通过微信朋友圈 / 私聊 / 群聊传播自己的戏命师命铺
→ 好友进入命铺、问命、抽盲盒、买铭文
→ 平台通过 899、盲盒、铭文、解封等变现
```

因此，上一版文档中的部分任务仍然保留，但优先级要重排。

### 0.1 上一版仍然保留的内容

这些仍然必须做：

- 支付订单系统
- BufPay 接入
- 支付回调验签
- 权益幂等发放
- 后台补单
- 用户资产落库
- 运营日志
- 合规文案
- 上线 QA

### 0.2 上一版需要降级的内容

这些不再是主线：

- 网页站内聊天作为主体验
- 普通 ¥49.99 站内会员订阅
- 单纯网页分享卡裂变
- 网页市场大盘
- 站内命盘解封作为唯一付费入口

### 0.3 新版必须新增的内容

新版主线必须新增：

- 微信 / ClawBot 绑定流程
- 机器人 webhook 消息通道
- 微信机器人指令系统
- 899 经营者命铺身份
- 经营者推广码 / 二维码 / 落地页
- 好友归因
- 经营者看板
- 盲盒订单、抽卡记录、概率版本
- 铭文资产、装配位、机器人能力加成
- 经营者裂变任务
- 微信场景合规与风控

---

## 1. 新版产品定位

### 1.1 一句话定位

```text
把戏命师养进你的微信里，让它替你聊天、问命、出图、经营命铺。
```

### 1.2 产品主场

新版产品主场不是网页，而是微信。

| 场景               | 作用                                             |
| ------------------ | ------------------------------------------------ |
| 微信 / ClawBot     | 用户主要对话、问事、抽签、经营者推广             |
| H5 / Web           | 绑定、支付、盲盒、铭文背包、命铺主页、分享落地页 |
| 后台               | 订单、用户、经营者、补单、资产、风控、统计       |
| Cloudflare Workers | API、webhook、支付回调、AI 服务层                |
| D1 / KV / R2       | 数据、会话、资产、分享图、日志                   |

### 1.3 商业主线

```text
C 端免费绑定微信戏命师
→ 免费问事 / 抽签 / 低门槛体验
→ ¥5.99 解封命盘 / 小额道具
→ 盲盒 / 铭文消费
→ ¥899 开通经营者命铺
→ 经营者带来新用户与消费
```

### 1.4 不建议的表达

避免使用：

- 躺赚
- 稳赚
- 自动赚钱
- 月入过万
- AI 替你收钱
- 保证收益
- 招代理暴富

建议使用：

- 命铺经营者
- 分享命铺
- 平台奖励
- 香火值
- 经营值
- 经营看板
- 推广归因
- 虚拟道具收益
- 活动奖励资格

---

## 2. 当前项目状态判断

当前 `Dreamer` 项目已经具备：

- Cloudflare Workers / TanStack Start 基础架构
- D1 / KV / R2 / Queue / Cron 配置
- 用户、session、消息、每日状态、分享卡、出马申请等服务层
- Web 聊天 UI
- 充值、订阅、盲盒、市场、出马、分享卡、解封命盘等前端弹窗
- DeepSeek via Cloudflare AI Gateway 的 AI 回复链路和 fallback 逻辑

但当前项目还缺少新版核心：

- 微信 / ClawBot 绑定
- 微信机器人 webhook
- 微信机器人消息收发
- 经营者命铺身份系统
- 899 经营者支付闭环
- 好友归因
- 盲盒真实订单和抽卡记录
- 铭文资产与装配
- 经营者看板
- 后台补单和资产管理
- 真实商业风控

---

## 3. 新版上线目标

### 3.1 第一版公开 MVP 目标

第一版只验证三件事：

```text
1. 用户是否愿意绑定微信戏命师？
2. 用户是否愿意通过微信把戏命师分享给朋友？
3. 用户是否愿意支付 ¥899 成为经营者？
```

### 3.2 第一版不做或弱化

第一版暂不重点做：

- 完整交易市场
- 现金分佣提现
- 多级分销
- 复杂命理排盘
- 完整盲盒交易市场
- 真实资产自由交易
- 大规模自动私聊营销

### 3.3 第一版必须完成

第一版必须完成：

- 微信 / ClawBot 绑定
- 机器人基础对话
- 机器人指令系统
- 899 经营者支付
- 经营者推广码
- 经营者命铺页
- 好友归因
- 基础盲盒
- 铭文资产
- 支付订单系统
- 后台补单
- 合规文案

---

## 4. 新版信息架构

### 4.1 Web 首页

旧首页以聊天窗口为中心。新版首页改成：

```text
主标题：
把戏命师养进你的微信里

副标题：
一个会毒舌、会问命、会帮你经营朋友圈命铺的 AI 命师分身。

主 CTA：
绑定微信，领取我的戏命师

次 CTA：
开通 ¥899 命铺经营者

第三 CTA：
先体验网页版戏命师
```

首页模块：

1. 绑定微信
2. 戏命师能做什么
3. 经营者如何赚钱 / 经营
4. 盲盒与铭文
5. 用户案例 / 演示视频
6. 风险说明与服务边界

### 4.2 绑定成功页

```text
你的戏命师已进入微信
请回到微信发送：

今日
感情
财运
抽签
盲盒
命铺
```

### 4.3 经营者页

```text
标题：
开一间微信里的戏命铺

卖点：
- 专属命铺二维码
- 每日朋友圈文案
- 好友问命入口
- 盲盒与铭文经营加成
- 经营看板
- 香火值与平台活动奖励

价格：
¥899 / 月
```

### 4.4 命铺落地页

每个经营者拥有专属链接：

```text
/s/:refCode
/shop/:operatorCode
```

落地页内容：

- 经营者头像 / 命铺名
- 今日主推玩法
- 免费问一句
- 抽今日签
- 盲盒入口
- 绑定自己的戏命师
- 归因到经营者

---

## 5. 微信 / ClawBot 机器人设计

### 5.1 基础指令

微信机器人必须支持短指令，降低操作门槛。

| 指令 | 功能                     |
| ---- | ------------------------ |
| 今日 | 今日运势 / 今日任务      |
| 感情 | 感情问事                 |
| 财运 | 财运 / 副业 / 钱         |
| 工作 | 事业 / 合作 / 跳槽       |
| 合盘 | 邀请另一人合盘           |
| 抽签 | 免费抽签                 |
| 盲盒 | 打开盲盒入口             |
| 铭文 | 查看 / 装配铭文          |
| 命铺 | 经营者入口               |
| 推广 | 生成朋友圈文案           |
| 我的 | 查看账户、资产、经营状态 |
| 帮助 | 查看可用指令             |

### 5.2 机器人回复结构

每次回复尽量遵循：

```text
1. 结论
2. 毒舌 / 情绪点
3. 一个具体行动
4. 一个下一步指令
```

示例：

```text
你今日财帛宫有动，但不是钱来找你，是你得开口找钱。

15:00-17:00 适合报价、催款、发朋友圈。
别装清高，清高不能结账。

回「推广」我给你写一条今日朋友圈。
回「盲盒」抽个财帛铭文。
```

### 5.3 经营者机器人回复

经营者发送：

```text
推广
```

机器人回复：

```text
掌柜，今日适合发「感情局」。

朋友圈文案 1：
有些人不是不爱你，是你俩命盘互相克嘴。
想知道你们是正缘还是孽缘？发我生日。

朋友圈文案 2：
今日免费测 3 个，超过要烧香。
别问准不准，先问你敢不敢听真话。

你的命铺链接：
https://bige.life/s/xxxx

回「生成图」我给你出一张朋友圈配图。
```

---

## 6. 数据库改造

### 6.1 微信绑定表

```sql
CREATE TABLE wechat_bindings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'clawbot',
  provider_user_id TEXT NOT NULL UNIQUE,
  openid TEXT,
  unionid TEXT,
  nickname TEXT,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  bind_scene TEXT,
  raw_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wechat_bindings_user ON wechat_bindings(user_id);
CREATE INDEX idx_wechat_bindings_provider_user ON wechat_bindings(provider_user_id);
```

### 6.2 机器人消息表

```sql
CREATE TABLE bot_messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  binding_id TEXT,
  channel TEXT NOT NULL DEFAULT 'clawbot',
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  message_type TEXT NOT NULL DEFAULT 'text',
  content TEXT,
  intent TEXT,
  raw_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bot_messages_user_time ON bot_messages(user_id, created_at);
```

### 6.3 经营者表

```sql
CREATE TABLE operators (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'operator_899',
  status TEXT NOT NULL DEFAULT 'inactive',
  shop_name TEXT,
  referral_code TEXT NOT NULL UNIQUE,
  subscribed_until TEXT,
  total_invites INTEGER NOT NULL DEFAULT 0,
  total_conversions INTEGER NOT NULL DEFAULT 0,
  total_paid_cents INTEGER NOT NULL DEFAULT 0,
  incense_value INTEGER NOT NULL DEFAULT 0,
  risk_status TEXT NOT NULL DEFAULT 'normal',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_operators_referral_code ON operators(referral_code);
CREATE INDEX idx_operators_status ON operators(status);
```

### 6.4 经营者归因表

```sql
CREATE TABLE operator_referrals (
  id TEXT PRIMARY KEY,
  operator_user_id TEXT NOT NULL,
  invitee_user_id TEXT,
  referral_code TEXT NOT NULL,
  source_scene TEXT,
  first_touch_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  converted_at TEXT,
  first_payment_id TEXT,
  total_paid_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'visited',
  ip_hash TEXT,
  ua_hash TEXT
);

CREATE INDEX idx_operator_referrals_operator ON operator_referrals(operator_user_id);
CREATE INDEX idx_operator_referrals_invitee ON operator_referrals(invitee_user_id);
CREATE INDEX idx_operator_referrals_code ON operator_referrals(referral_code);
```

### 6.5 支付订单表

```sql
CREATE TABLE payments (
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
  referral_code TEXT,
  operator_user_id TEXT,
  qr TEXT,
  qr_img TEXT,
  qr_price TEXT,
  expires_at TEXT,
  callback_raw_json TEXT,
  provider_raw_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_user_status ON payments(user_id, status);
CREATE INDEX idx_payments_product ON payments(product_code);
CREATE INDEX idx_payments_operator ON payments(operator_user_id);
```

### 6.6 用户资产表

```sql
CREATE TABLE user_assets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('master', 'inscription', 'skin', 'ticket', 'frame')),
  asset_code TEXT NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'normal',
  quantity INTEGER NOT NULL DEFAULT 1,
  level INTEGER NOT NULL DEFAULT 1,
  locked INTEGER NOT NULL DEFAULT 0,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_assets_user_type ON user_assets(user_id, asset_type);
```

### 6.7 铭文装配表

```sql
CREATE TABLE inscription_equips (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  slot_index INTEGER NOT NULL,
  bot_scope TEXT NOT NULL DEFAULT 'default',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, slot_index, bot_scope)
);
```

### 6.8 盲盒抽卡表

```sql
CREATE TABLE blindbox_draws (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  payment_id TEXT,
  box_type TEXT NOT NULL,
  draw_count INTEGER NOT NULL DEFAULT 1,
  probability_version TEXT NOT NULL,
  result_json TEXT NOT NULL,
  referral_code TEXT,
  operator_user_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_blindbox_draws_user ON blindbox_draws(user_id);
CREATE INDEX idx_blindbox_draws_operator ON blindbox_draws(operator_user_id);
```

### 6.9 奖励流水表

```sql
CREATE TABLE reward_ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  reward_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  source_id TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reward_ledger_user ON reward_ledger(user_id);
```

---

## 7. 服务端改造

### 7.1 新增文件建议

```text
src/lib/server/xms-wechat.server.ts
src/lib/server/xms-bot.server.ts
src/lib/server/xms-operator.server.ts
src/lib/server/xms-payment.server.ts
src/lib/server/xms-assets.server.ts
src/lib/server/xms-blindbox.server.ts
src/lib/server/xms-inscriptions.server.ts
src/lib/server/xms-growth.server.ts
src/lib/api/operator.functions.ts
src/lib/api/payment.functions.ts
src/lib/api/assets.functions.ts
src/lib/api/blindbox.functions.ts
```

### 7.2 `server.ts` 新增 webhook 路由

需要在 TanStack Start handler 前拦截：

```text
/api/bot/clawbot/webhook
/api/wechat/bind/callback
/api/pay/callback
/api/pay/mock-success
```

优先级：

```text
1. 支付回调
2. 微信 / ClawBot webhook
3. R2 assets
4. TanStack Start 页面
```

### 7.3 机器人消息处理链路

```text
收到微信 / ClawBot 消息
→ 验证签名
→ 找到 wechat_binding
→ 找不到则创建游客 user
→ 记录 bot_messages in
→ 识别指令 intent
→ 调用 generateMasterReply 或专用业务 handler
→ 根据 intent 加上 CTA
→ 记录 bot_messages out
→ 返回消息给微信 / ClawBot
```

### 7.4 指令 intent 识别

第一版可以用规则：

```ts
if (/今日|运势|流日/.test(text)) return "daily";
if (/感情|姻缘|复合|对象/.test(text)) return "love";
if (/财|钱|副业|收入/.test(text)) return "money";
if (/盲盒|抽/.test(text)) return "blindbox";
if (/铭文|装备/.test(text)) return "inscription";
if (/命铺|经营|掌柜|899/.test(text)) return "operator";
if (/推广|朋友圈|文案/.test(text)) return "promo";
```

后续再改成 LLM intent classifier。

### 7.5 支付产品 SKU

第一版 SKU：

| product_code     |         名称 |   价格 | 作用         |
| ---------------- | -----------: | -----: | ------------ |
| seal_unlock      |     解封命盘 |  ¥5.99 | C 端小额转化 |
| operator_899     |   命铺经营者 |   ¥899 | 核心订阅     |
| blindbox_single  | 命师盲盒单抽 |    ¥99 | 盲盒营收     |
| blindbox_ten     | 命师盲盒十连 |   ¥888 | 盲盒营收     |
| inscription_pack |     铭文礼包 |   待定 | 铭文营收     |
| qiyun_topup      |     气运充值 | 自定义 | 补充消费     |

注意：第一版可以保留 ¥49.99，但不建议作为主线会员。可以调整为“月令小契约”或“体验版经营者试用”。

---

## 8. 经营者系统

### 8.1 899 经营者权益

```text
1. 专属命铺二维码
2. 专属 referral_code
3. 微信戏命师经营者模式
4. 每日朋友圈文案
5. 好友问命归因
6. 好友消费统计
7. 香火值 / 经营值看板
8. 铭文装配位 +2
9. 经营者专属盲盒池
10. 平台活动奖励资格
```

### 8.2 经营者开通流程

```text
用户在微信发送「命铺」
↓
机器人介绍经营者权益
↓
跳转 H5 支付页
↓
支付 ¥899
↓
BufPay 回调
↓
激活 operators.status = active
↓
生成 referral_code
↓
返回微信消息：你的命铺已开
↓
给经营者命铺二维码和今日推广文案
```

### 8.3 经营者看板

第一版看板字段：

```text
今日访问
今日新用户
今日问命人数
今日盲盒消费
累计香火值
累计转化金额
当前铭文配置
今日推荐推广主题
```

暂时不要展示“可提现金额”，先展示“香火值 / 经营值”。

### 8.4 经营者归因规则

第一版归因规则：

```text
朋友通过 /s/:refCode 进入
→ 记录 first_touch
→ 如果朋友首次绑定微信，则绑定 invitee_user_id
→ 朋友 7 天内消费，归因给经营者
→ 经营者获得香火值
```

后续再支持现金分润。

### 8.5 防刷规则

第一版必须做基础防刷：

```text
同 IP 高频访问不重复计有效邀请
同 UA / fingerprint 异常不重复计奖励
同 invitee_user_id 只归因一次
支付成功后再计转化
退款 / 异常订单可冲正
```

---

## 9. 盲盒与铭文系统

### 9.1 盲盒定位

盲盒不是单纯抽卡，而是给微信戏命师和经营者命铺提供能力。

抽到的东西必须能影响：

- 机器人回复风格
- 机器人技能
- 分享卡外观
- 朋友圈文案能力
- 经营者转化工具
- 命铺等级展示

### 9.2 第一版盲盒池

```text
普通：
- 人玑命师碎片
- 普通判词卡框
- 气运
- 抽签券

稀有：
- 地璇命师
- 桃花铭文
- 财帛铭文
- 文昌铭文

史诗：
- 天枢命师
- 破军铭文
- 武曲铭文
- 经营者推广卡面

传说：
- 混沌命师
- 天机铭文
- 限定命铺皮肤
```

### 9.3 铭文作用

| 铭文     | 作用                       |
| -------- | -------------------------- |
| 桃花铭文 | 增强感情 / 合盘回复        |
| 财帛铭文 | 增强财运 / 副业 / 经营建议 |
| 文昌铭文 | 生成朋友圈文案             |
| 破军铭文 | 回复更毒舌，更适合传播     |
| 武曲铭文 | 经营者转化建议             |
| 天机铭文 | 深度命盘 / 高级解读        |
| 贪狼铭文 | 社交传播卡片加成           |

### 9.4 铭文装配

第一版每个用户默认 2 个槽位。

经营者：

```text
基础槽位 2
开通 899 后 +2
稀有命师可能额外 +1
```

装配后影响机器人 system prompt：

```text
用户当前装配铭文：
- 桃花铭文：感情问题更细腻，更多合盘钩子。
- 破军铭文：允许更强毒舌，但不得羞辱用户。
```

### 9.5 概率与审计

必须保存：

- probability_version
- draw_result_json
- payment_id
- user_id
- operator_user_id
- created_at

盲盒概率一旦上线，不要随便改。改动必须版本化。

---

## 10. 支付系统新版要求

### 10.1 BufPay 仍然必须做

BufPay 不再只服务 ¥5.99 / ¥49.99，而是服务：

- ¥899 经营者
- 盲盒单抽 / 十连
- 铭文礼包
- 解封命盘

### 10.2 支付回调权益发放

权益必须按 `product_code`，不要按价格判断。

```text
operator_899:
- 开通 operators
- subscribed_until +30 天
- 装配位 +2
- 生成 referral_code

blindbox_single:
- 创建 blindbox_draw
- 发放 user_assets

blindbox_ten:
- 创建 10 连 blindbox_draw
- 发放 user_assets

inscription_pack:
- 发放铭文资产

seal_unlock:
- seal_unlocked = 100
- chart_glow = 100
```

### 10.3 幂等要求

所有权益发放必须幂等：

```text
payments.entitlement_applied = 0 才能发权益
发完后设置 entitlement_applied = 1
重复回调返回 200，但不重复发放
```

---

## 11. 前端改造

### 11.1 首页改造

旧首页：

```text
聊天窗口 + 侧边栏 + 右侧面板
```

新版首页：

```text
微信绑定落地页 + 经营者转化页 + 体验入口
```

保留网页版聊天作为：

```text
/try
/debug-chat
```

### 11.2 新增页面

```text
/
/bind
/bind/success
/operator
/operator/pay
/operator/dashboard
/s/:refCode
/shop/:operatorCode
/assets
/blindbox
/inscriptions
/pay/result
/admin
```

### 11.3 支付组件

统一支付组件 `PaymentPanel`，支持：

- 微信 / 支付宝选择
- 二维码展示
- 倒计时
- 订单状态轮询
- mock success
- 支付成功后跳转对应结果页

### 11.4 经营者看板 UI

第一版不追求复杂，必须清晰：

```text
今日访问
新增绑定
好友问命
盲盒订单
香火值
我的命铺链接
今日朋友圈文案
我的铭文配置
```

---

## 12. 后台管理

第一版必须有最小后台，不然无法运营。

### 12.1 后台功能

```text
用户查询
微信绑定查询
支付订单查询
订单补单
经营者查询
经营者状态调整
资产查询
手动发放资产
盲盒抽卡记录
回调日志
AI 消息日志
异常用户标记
```

### 12.2 后台权限

第一版可以简单用环境变量：

```text
ADMIN_TOKEN
```

访问 `/admin` 时输入 token。

后续再做管理员账号。

---

## 13. 合规与风险

### 13.1 命理内容风险

必须声明：

```text
本产品为娱乐互动和虚拟内容服务，不构成现实决策、医疗、法律、投资、婚恋等专业建议。
```

### 13.2 经营者风险

必须避免：

- 保证收益
- 诱导贷款
- 多级分销
- 传销式返利
- 虚假订单截图
- 夸大赚钱效果

### 13.3 盲盒风险

必须做：

- 概率公示
- 虚拟商品说明
- 未成年人限制
- 退款规则
- 理性消费提示

### 13.4 微信平台风险

不要做：

- 非官方个人号外挂
- 批量私聊骚扰
- 自动群发垃圾营销
- 诱导分享违规文案
- 规避微信平台规则

建议：

- 优先使用官方或合规通道
- 如果 ClawBot API 尚不稳定，先用公众号 / 小程序 / H5 承接
- 经营者传播以“手动复制文案 / 手动分享”为主，不做自动群发

---

## 14. 阶段计划

## Phase 0：战略重构与路由冻结

目标：冻结新版核心，不再继续按旧网页聊天平台扩张。

任务：

- [ ] 确认新版首页结构
- [ ] 冻结第一版 SKU
- [ ] 冻结第一版数据库表
- [ ] 冻结经营者权益
- [ ] 冻结盲盒与铭文第一版配置
- [ ] 把市场交易后置
- [ ] 把网页聊天降级为体验入口

验收标准：

- [ ] 有新版产品路径图
- [ ] 有第一版 SKU 表
- [ ] 有数据库迁移草案
- [ ] 有页面路由清单
- [ ] 有不做事项清单

---

## Phase 1：微信 / ClawBot 绑定与机器人 MVP

目标：用户可以把戏命师绑定到微信，并通过微信对话。

任务：

- [ ] 新增 `wechat_bindings`
- [ ] 新增 `bot_messages`
- [ ] 新增 `/api/bot/clawbot/webhook`
- [ ] 新增绑定页 `/bind`
- [ ] 新增绑定成功页
- [ ] 消息 webhook 验签
- [ ] 用户身份打通
- [ ] 微信消息调用 `generateMasterReply`
- [ ] 支持基础指令：今日、感情、财运、抽签、盲盒、铭文、命铺、推广
- [ ] 机器人回复记录入库

验收标准：

- [ ] 新用户可绑定微信
- [ ] 微信发「今日」有回复
- [ ] 微信发「命铺」能收到经营者引导
- [ ] 微信消息有入库记录
- [ ] 未绑定用户不会报错
- [ ] webhook 签名错误会拒绝

---

## Phase 2：支付系统与 BufPay

目标：支持真实支付和权益幂等发放。

任务：

- [ ] 新增 `payments` 表
- [ ] 新增 `xms-payment.server.ts`
- [ ] 实现 BufPay 创建订单
- [ ] 实现 `/api/pay/callback`
- [ ] 实现 MD5 验签
- [ ] 实现订单状态查询
- [ ] 实现 mock success
- [ ] 实现统一 `PaymentPanel`
- [ ] 支持 SKU：`operator_899`、`blindbox_single`、`blindbox_ten`、`seal_unlock`

验收标准：

- [ ] 无 secret 时 mock 支付可完整闭环
- [ ] 有 secret 时可生成 BufPay 二维码
- [ ] 回调验签错误不发权益
- [ ] 重复回调不重复发权益
- [ ] 支付成功可刷新用户权益
- [ ] D1 payments 有完整记录

---

## Phase 3：899 经营者命铺

目标：用户支付 899 后成为经营者，并拥有命铺链接和看板。

任务：

- [ ] 新增 `operators`
- [ ] 新增 `operator_referrals`
- [ ] 新增 `/operator`
- [ ] 新增 `/operator/pay`
- [ ] 新增 `/operator/dashboard`
- [ ] 新增 `/s/:refCode`
- [ ] 支付成功后开通经营者
- [ ] 生成 referral_code
- [ ] 生成命铺链接
- [ ] 经营者可生成朋友圈文案
- [ ] 好友访问命铺可归因
- [ ] 好友消费可归因

验收标准：

- [ ] 支付 899 后 operator 激活
- [ ] 经营者拥有唯一 referral_code
- [ ] `/s/:refCode` 可打开
- [ ] 好友访问会记录 referral
- [ ] 好友绑定后归因到经营者
- [ ] 好友消费后经营者香火值增加
- [ ] 看板数据正确

---

## Phase 4：盲盒系统

目标：盲盒成为真实可支付、可抽取、可落库、可审计的营收模块。

任务：

- [ ] 新增 `blindbox_draws`
- [ ] 定义第一版盲盒池
- [ ] 定义概率版本
- [ ] 实现单抽
- [ ] 实现十连
- [ ] 抽卡结果生成 user_assets
- [ ] 盲盒支付与订单关联
- [ ] 盲盒结果页
- [ ] 经营者归因
- [ ] 概率公示页

验收标准：

- [ ] 单抽支付后发放资产
- [ ] 十连支付后发放 10 个结果
- [ ] 每次抽卡保存 probability_version
- [ ] 抽卡结果可在背包查看
- [ ] 概率配置不可被前端篡改
- [ ] 经营者来源订单可归因

---

## Phase 5：铭文资产与装配

目标：铭文影响微信戏命师能力，形成长期消费。

任务：

- [ ] 新增 `user_assets`
- [ ] 新增 `inscription_equips`
- [ ] 新增 `/assets`
- [ ] 新增 `/inscriptions`
- [ ] 实现铭文背包
- [ ] 实现铭文装配
- [ ] 装配结果进入 AI prompt
- [ ] 经营者增加铭文槽位
- [ ] 铭文礼包支付 SKU
- [ ] 铭文效果说明

验收标准：

- [ ] 用户可查看铭文资产
- [ ] 用户可装配 / 卸下铭文
- [ ] 装配铭文会改变机器人回复策略
- [ ] 经营者槽位更多
- [ ] 支付铭文礼包可发放铭文
- [ ] 铭文资产不会重复异常发放

---

## Phase 6：后台运营

目标：能处理支付、补单、用户、经营者和资产问题。

任务：

- [ ] 新增 `/admin`
- [ ] ADMIN_TOKEN 鉴权
- [ ] 用户查询
- [ ] 微信绑定查询
- [ ] 支付订单查询
- [ ] 手动补单
- [ ] 经营者查询
- [ ] 资产查询
- [ ] 手动发放资产
- [ ] 盲盒记录查询
- [ ] 回调日志查看

验收标准：

- [ ] 管理员可查订单
- [ ] 管理员可手动补发权益
- [ ] 补发操作有日志
- [ ] 管理员可查经营者和归因
- [ ] 管理员可查用户资产
- [ ] 未授权访问后台被拒绝

---

## Phase 7：合规、风控与上线 QA

目标：公开上线前完成最低安全边界。

任务：

- [ ] 用户协议
- [ ] 隐私政策
- [ ] 虚拟商品说明
- [ ] 盲盒概率说明
- [ ] 退款规则
- [ ] 经营者服务说明
- [ ] 娱乐用途免责声明
- [ ] 未成年人提示
- [ ] 风控规则
- [ ] 上线 QA Checklist

验收标准：

- [ ] 所有付费页有虚拟商品和退款说明
- [ ] 盲盒页有概率说明
- [ ] 经营者页无保证收益话术
- [ ] 微信机器人不主动骚扰用户
- [ ] 支付失败 / 超时 / 重复回调均可处理
- [ ] D1 / KV / R2 / Worker 生产环境正常

---

## 15. 验收方式

每个 Phase 完成后，开发线程必须提交：

```text
1. PR 链接或分支名
2. 改动摘要
3. 涉及文件列表
4. 数据库 migration 文件
5. 本地自测步骤
6. 生产 / 预发验证截图或日志
7. npm run lint 结果
8. npm run build 结果
9. D1 migration 执行结果
10. 风险说明
```

支付相关 Phase 还必须提交：

```text
1. 测试订单号
2. 回调 payload
3. 验签结果
4. D1 payments 查询结果
5. 权益发放前后用户记录
6. 重复回调测试结果
```

微信机器人相关 Phase 还必须提交：

```text
1. webhook 请求样例
2. 签名验证方式
3. 入库 bot_messages 记录
4. 微信端回复截图
5. 未绑定用户处理截图
```

盲盒相关 Phase 还必须提交：

```text
1. 概率配置
2. 抽卡记录
3. 用户资产记录
4. 十连抽结果
5. 经营者归因记录
```

---

## 16. 上线前硬性阻塞清单

以下任何一项未完成，不建议公开收款运营：

- [ ] 微信 / ClawBot 绑定不可用
- [ ] 机器人 webhook 不稳定
- [ ] BufPay 回调未验签
- [ ] 支付权益不能幂等
- [ ] 899 经营者没有到期时间
- [ ] 经营者没有归因记录
- [ ] 盲盒没有抽卡记录
- [ ] 盲盒没有概率版本
- [ ] 铭文不能落库
- [ ] 后台不能补单
- [ ] 付费页没有退款 / 虚拟商品说明
- [ ] 经营者页出现保证收益话术
- [ ] 微信机器人存在自动骚扰风险

---

## 17. 当前项目具体优化建议

### 17.1 `src/routes/index.tsx`

当前主页面仍然以 ChatWindow 为中心。新版建议：

- `/` 改为微信绑定与经营者转化页
- 当前聊天页迁移到 `/try`
- 弹窗入口不要全部挂在首页首屏
- 经营者、盲盒、铭文改成独立路由

### 17.2 `src/components/Modals.tsx`

当前充值、订阅、盲盒、解封大量是模拟交互。新版建议：

- 删除“模拟支付”文案
- 抽出 `PaymentPanel`
- 盲盒不再前端 setTimeout 出结果
- 盲盒结果必须来自服务端
- 订阅弹窗改成经营者开通页
- SealModal 保留为小额转化

### 17.3 `src/lib/server/xms-service.server.ts`

当前业务服务主要围绕网页 session、聊天、签到、分享。新版建议：

- 保留 `ensureSessionFromToken`
- 抽离微信机器人逻辑到 `xms-bot.server.ts`
- 抽离经营者逻辑到 `xms-operator.server.ts`
- 抽离支付逻辑到 `xms-payment.server.ts`
- 抽离资产逻辑到 `xms-assets.server.ts`

### 17.4 `src/lib/server/xms-ai.server.ts`

当前 prompt 已有公开运营边界，这是好的。新版建议新增：

- 经营者模式 prompt
- 铭文装配 prompt
- 微信短消息风格
- 指令 CTA 模板
- 防违规营销规则

### 17.5 `src/server.ts`

新增并优先处理：

```text
/api/pay/callback
/api/bot/clawbot/webhook
/api/wechat/bind/callback
/api/assets/*
```

### 17.6 `wrangler.jsonc`

新增非敏感 vars：

```json
{
  "APP_BASE_URL": "https://bige.life",
  "BOT_PROVIDER": "clawbot",
  "BUFPAY_MOCK": "false"
}
```

敏感信息用 secret：

```bash
wrangler secret put BUFPAY_AID
wrangler secret put BUFPAY_SECRET
wrangler secret put CLAWBOT_WEBHOOK_SECRET
wrangler secret put ADMIN_TOKEN
```

---

## 18. 推荐开发顺序

最推荐的顺序：

```text
1. Phase 0：冻结新版战略和路由
2. Phase 1：微信 / ClawBot 绑定与机器人
3. Phase 2：支付系统
4. Phase 3：899 经营者
5. Phase 4：盲盒
6. Phase 5：铭文
7. Phase 6：后台
8. Phase 7：合规与 QA
```

不要先做市场交易。

不要先做复杂收益提现。

不要先做多级分销。

不要继续把网页聊天当成主入口优化。

---

## 19. 给开发线程的执行指令

```text
请按《紫微戏命师新版上线剩余工作安排：微信机器人 / 经营者 / 盲盒铭文版》执行。

上一版“网页站内付费 MVP”计划作废，不再以网页聊天、¥49.99 订阅、网页分享卡作为主线。

新版主线是：
1. 微信 / ClawBot 绑定
2. 微信里的戏命师机器人
3. ¥899 经营者命铺
4. 经营者推广归因
5. 盲盒与铭文资产经济
6. BufPay 支付和后台补单

每个 Phase 完成后提交 PR / 分支、改动摘要、文件列表、migration、build/lint 结果、自测证据。支付、微信机器人、盲盒相关批次必须提交日志和数据库记录。

开发优先级严格按 Phase 0 → Phase 7，不得先扩展市场交易、提现、多级分销或复杂命理报告。
```

---

## 20. 验收结论模板

后续每个 PR 验收时使用：

```text
验收对象：
PR / 分支：

结论：
通过 / 有条件通过 / 不通过

已通过项：
-

阻塞问题：
-

必须修改：
-

建议优化：
-

是否允许进入下一 Phase：
是 / 否
```

---

## 21. 最终判断

新版产品不是网页命理站，而是：

```text
微信原生 AI 命师经营网络
```

核心资产是：

```text
1. 用户微信里的戏命师机器人
2. 经营者的命铺分发节点
3. 盲盒和铭文构成的机器人养成经济
```

因此，当前项目的下一步不是继续完善网页聊天，而是立即转向：

```text
微信绑定
→ 机器人消息
→ 899 经营者
→ 归因
→ 盲盒
→ 铭文
→ 后台
```

这份文档即为新版开发和验收基准。
