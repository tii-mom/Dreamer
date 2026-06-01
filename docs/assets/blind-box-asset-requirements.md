# 戏命师盲盒与美术资源需求

## 结论

第一版需要为盲盒制作戏命师图片。原因是盲盒的核心爽感来自“抽到具体角色”，如果只有等级文案，没有角色脸、卡面、开盒反馈和市场展示，用户不会产生收藏、分享和挂售欲望。

建议 MVP 采用“三等级 + 隐藏 + 见习”的小而完整资源集：

- 见习命师：1 张固定角色。
- T3 人玑：12 张。
- T2 地璇：8 张。
- T1 天枢：4 张。
- 隐藏混沌：1 张。

合计 26 张戏命师角色卡。这个数量足够支撑首发抽卡、市场流通、分享传播，也不会让第一版美术成本失控。

## 角色卡规格

每张角色至少提供：

- `card.webp`：主卡，1024x1536，竖版，用于盲盒结果、市场、详情页。
- `avatar.webp`：头像，512x512，用于聊天、列表、排行榜。
- `thumb.webp`：缩略图，320x480，用于抽卡历史和市场小卡。
- 可选 `full.png`：透明背景立绘，1536x2048，用于后续活动页。

命名格式：

- `renji-01-card.webp`
- `renji-01-avatar.webp`
- `renji-01-thumb.webp`
- `dixuan-01-card.webp`
- `tianshu-01-card.webp`
- `chaos-01-card.webp`

## 等级数量

### 见习命师，1 张

目录：`public/assets/masters/trainee`

用途：新用户注册即送，不能交易。

视觉：灰色、无眼部光效、空白卷轴背景。

### T3 人玑，12 张

目录：`public/assets/masters/renji`

定位：蓝色稀有，大部分用户会抽到，所以需要最多变体，避免重复感。

专精方向建议：

1. 星座塔罗
2. 每日运势
3. 面相气色
4. 情绪陪伴
5. 桃花提示
6. 职场提醒
7. 失物寻踪
8. 学业考试
9. 社交破冰
10. 灵签解释
11. 梦境解析
12. 周运复盘

### T2 地璇，8 张

目录：`public/assets/masters/dixuan`

定位：紫色史诗，用户抽到后应明显感觉“值钱”。

专精方向建议：

1. 八字合婚
2. 风水择日
3. 手相事业
4. 家宅气场
5. 合作贵人
6. 开业择时
7. 情感复合
8. 年运大势

### T1 天枢，4 张

目录：`public/assets/masters/tianshu`

定位：金色传说，稀缺、强展示、强分享。

专精方向建议：

1. 紫微全盘
2. 八字大运
3. 财帛推演
4. 人生关键节点

### 隐藏混沌，1 张

目录：`public/assets/masters/chaos`

定位：0.5% 隐藏神话，黑金、破碎星图、混沌漩涡。

注意：文案可以刺激，但不能承诺“逆天改命真实发生”，只能表达为“解读视角升级”“凶象重写为行动方案”。

## 盲盒外观资源

目录：`public/assets/blind-box/box`

需要 5 张：

- `box-standard.webp`：普通盲盒。
- `box-renji.webp`：蓝色稀有氛围盒。
- `box-dixuan.webp`：紫色史诗氛围盒。
- `box-tianshu.webp`：金色传说氛围盒。
- `box-chaos.webp`：黑金隐藏氛围盒。

## 开盒动效资源

目录：`public/assets/blind-box/opening`

MVP 可以不用视频，先用序列帧 + CSS 动效：

- `open-01.webp` 到 `open-06.webp`：开盒 6 帧。
- `flash-blue.webp`：人玑光效。
- `flash-purple.webp`：地璇光效。
- `flash-gold.webp`：天枢光效。
- `flash-chaos.webp`：混沌光效。
- `particle-star.webp`：星尘粒子。
- `particle-talisman.webp`：符纸粒子。

## 抽中结果资源

目录：`public/assets/blind-box/results`

需要 8 张：

- `result-bg-renji.webp`
- `result-bg-dixuan.webp`
- `result-bg-tianshu.webp`
- `result-bg-chaos.webp`
- `badge-renji.svg`
- `badge-dixuan.svg`
- `badge-tianshu.svg`
- `badge-chaos.svg`

## 铭文资源

首发不建议一次画满 50 张。MVP 先画 12 张代表铭文，后续按留存数据补齐。

目录：

- `public/assets/runes/silver`：6 张。
- `public/assets/runes/gold`：4 张。
- `public/assets/runes/chaos`：2 张。

首批建议：

- 银色：`S01`、`S05`、`S06`、`S08`、`S14`、`S20`
- 金色：`G05`、`G06`、`G12`、`G20`
- 黑色：`B01`、`B04`

单张规格：512x512 WebP 或 PNG，另备 SVG 边框更好。

## 分享与运营资源

目录：`public/assets/share`

需要 8 张：

- `share-daily-bg.webp`：每日流日分享卡背景。
- `share-seal-bg.webp`：命盘封印分享卡背景。
- `share-earn-bg.webp`：出马赚钱资格分享卡背景。
- `share-box-result-bg.webp`：抽中戏命师分享卡背景。
- `qr-frame.svg`：二维码框。
- `watermark.svg`：品牌水印。
- `invite-ribbon.webp`：邀请飘带。
- `streak-flame.webp`：连续签到火焰。

目录：`public/assets/marketing`

需要 6 张：

- `launch-poster-01.webp`
- `launch-poster-02.webp`
- `community-recall.webp`
- `earn-access-poster.webp`
- `blind-box-poster.webp`
- `daily-fortune-poster.webp`

## UI 资源

目录：`public/assets/ui`

需要 12 个基础资源：

- `coin.webp`：气运/香火币。
- `ticket.webp`：盲盒券。
- `seal-30.webp`：30% 命盘封印。
- `seal-60.webp`：60% 命盘封印。
- `seal-100.webp`：完整命盘。
- `streak-1.webp`
- `streak-7.webp`
- `streak-30.webp`
- `empty-market.webp`
- `empty-inventory.webp`
- `loading-oracle.webp`
- `warning-safe.svg`：合规提示图标。

## 抽奖机制

### 概率

首发沿用文档概率：

- T3 人玑：70%
- T2 地璇：25%
- T1 天枢：4.5%
- 隐藏混沌：0.5%

### 保底

为了公开运营，不建议完全裸随机。建议加入两层保底：

- 10 抽内必出 T2 或以上。
- 60 抽内必出 T1 或以上。

隐藏混沌不进普通保底，但每次未出混沌可累计“混沌因子”，最多只增加到 1.5%，避免无限膨胀。

### 每日限制

第一版不接真实支付，盲盒来源建议：

- 注册送见习命师，不送可交易盲盒。
- 连续签到 7 天送 1 张盲盒券碎片，4 片合成 1 抽。
- 邀请 3 个有效新用户送 1 抽。
- 完成出马申请送 1 次资格抽，不可交易。
- 运营活动可手动发放抽卡券。

### 防刷

- 同一匿名账号每日最多获得 1 个邀请奖励。
- 新用户必须完成首次对话和每日问安，才算有效邀请。
- 盲盒抽奖结果写入 D1，不只存在前端。
- 每次抽奖记录 random seed、概率版本、结果、来源、IP hash、user agent hash。

### 结果展示

抽中后展示：

1. 等级闪光。
2. 角色卡。
3. 专精标签。
4. 自带铭文。
5. 市场参考价区间。
6. 分享按钮。
7. “用于出马服务菜单”的入口。

## 项目首发图片总量

MVP 推荐总量：

- 戏命师角色卡：26 张主卡。
- 角色头像/缩略图：52 张。
- 盲盒外观：5 张。
- 开盒动效：12 张。
- 结果背景/徽章：8 张。
- 铭文：12 张。
- 分享资源：8 张。
- 营销海报：6 张。
- UI 资源：12 张。

合计：141 个前端资源文件。

如果要压缩成本，最低可用版：

- 角色主卡 10 张：见习 1、人玑 5、地璇 2、天枢 1、混沌 1。
- 头像/缩略图可由主卡自动裁切生成。
- 铭文先用 6 张。
- 其他资源控制在 20 张以内。

最低可用版约 36 个资源文件。

## 上传顺序

优先级从高到低：

1. `masters` 角色卡。
2. `blind-box/box` 和 `blind-box/results`。
3. `share` 分享卡背景。
4. `ui` 命盘、气运、抽卡券。
5. `runes` 铭文。
6. `marketing` 海报。
