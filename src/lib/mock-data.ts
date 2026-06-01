// Mock data for 戏命师 prototype
export const userMock = {
  nickname: "小天命",
  qiyun: 1280,
  wallet: 66.6,
  streak: 6,
  asksToday: 1,
  asksMax: 3,
  level: "见习命师",
  unread: 7,
  subscribed: false,
  shopOpen: false,
};

export const masterMock = {
  name: "命由天瞳",
  level: "见习命师",
  grade: "灰色",
  affinity: 42,
  specialty: ["紫微斗数", "八字", "每日问事"],
  runeSlots: { used: 1, max: 3 },
  currentRune: "角木蛟印",
  tradable: false,
  status: "在线，正在偷看你的命盘",
};

export const sidebarItems = [
  { key: "chat", group: "core", icon: "💬", label: "与戏命师对话", note: "在线，可叩问" },
  { key: "greet", group: "core", icon: "🕯️", label: "每日问安", note: "连续 6 日，灵签将至" },
  { key: "daily", group: "core", icon: "☀️", label: "今日流日", note: "财星动，宜叩问财运" },
  { key: "chart", group: "core", icon: "🌀", label: "命盘封印", note: "已开 30%，剩 70%" },
  { key: "box", group: "assets", icon: "🎴", label: "盲盒", note: "随机抽取命师与铭文" },
  { key: "market", group: "assets", icon: "🏮", label: "市场", note: "浏览在售命师与铭文" },
  { key: "rune", group: "assets", icon: "📜", label: "铭文", note: "可镶嵌铭文增强属性" },
  { key: "sub", group: "growth", icon: "✦", label: "订阅", note: "每日流日 + 吉时提醒" },
  { key: "topup", group: "growth", icon: "🪙", label: "充值", note: "增加问事次数" },
  { key: "earn", group: "growth", icon: "⚔️", label: "出马赚钱", note: "开通命铺接单赚钱" },
  { key: "income", group: "growth", icon: "💰", label: "我的收益", note: "昨日净利 ¥843" },
  { key: "friends", group: "growth", icon: "🤝", label: "好友助力", note: "邀请好友解锁命盘进度" },
  { key: "settings", group: "settings", icon: "⚙️", label: "设置", note: "" },
];

export const quickAsk = [
  "问事业前程",
  "问姻缘缘分",
  "问今日财运",
  "今日避坑解煞",
  "抽一支灵签",
  "发八字批算",
];

export const blindboxRates = [
  { tier: "人玑", color: "rare-blue", rate: 70, desc: "蓝色稀有" },
  { tier: "地璇", color: "rare-purple", rate: 25, desc: "紫色史诗" },
  { tier: "天枢", color: "rare-gold", rate: 4.5, desc: "金色传说" },
  { tier: "混沌", color: "rare-chaos", rate: 0.5, desc: "黑色神话" },
];

export const marketItems = [
  {
    id: 1,
    name: "天枢命师·北斗执笔",
    tier: "金色传说",
    color: "rare-gold",
    price: 3888,
    change: +12.4,
    spec: "紫微斗数 / 八字 / 面相",
    kind: "master",
  },
  {
    id: 2,
    name: "地璇命师·合婚画司",
    tier: "紫色史诗",
    color: "rare-purple",
    price: 1288,
    change: -3.1,
    spec: "合婚 / 风水择日",
    kind: "master",
  },
  {
    id: 3,
    name: "人玑命师·灵签童子",
    tier: "蓝色稀有",
    color: "rare-blue",
    price: 299,
    change: +0.8,
    spec: "塔罗 / 每日运势",
    kind: "master",
  },
  {
    id: 4,
    name: "武曲贪狼印",
    tier: "金色铭文",
    color: "rare-gold",
    price: 666,
    change: +6.6,
    spec: "财运类增强",
    kind: "rune",
  },
  {
    id: 5,
    name: "心月狐契",
    tier: "银色铭文",
    color: "bone",
    price: 188,
    change: -1.2,
    spec: "人心洞察类",
    kind: "rune",
  },
  {
    id: 6,
    name: "天梁化禄符",
    tier: "紫色铭文",
    color: "rare-purple",
    price: 488,
    change: +2.3,
    spec: "贵人提携类",
    kind: "rune",
  },
];

export const orderMock = [
  { id: 1, name: "张三", type: "事业问事", price: 49, status: "已完成", color: "emerald" },
  { id: 2, name: "李四", type: "合婚报告", price: 99, status: "生成中", color: "amber" },
  { id: 3, name: "王五", type: "今日运势", price: 19, status: "待支付", color: "purple" },
  { id: 4, name: "赵六", type: "八字精批", price: 199, status: "已完成", color: "emerald" },
];

export type ChatMsg =
  | { id: string; role: "master" | "user"; type: "text"; text: string }
  | { id: string; role: "master"; type: "card"; card: CardPayload };

export type CardPayload =
  | { kind: "reading"; title: string; topic: string; body: string }
  | { kind: "seal"; unlocked: number }
  | { kind: "sub" }
  | { kind: "shop" }
  | { kind: "box" }
  | { kind: "market" };

export const initialMessages: ChatMsg[] = [
  { id: "m1", role: "master", type: "text", text: "哟，终于有人把我从二维码里扫出来了。" },
  {
    id: "m2",
    role: "master",
    type: "text",
    text: "我是你的专属戏命师，千年前因泄露天机太多，被封在星盘里。现在给你当命理打工人，包月的那种。",
  },
  {
    id: "m3",
    role: "master",
    type: "text",
    text: "先别急着问姻缘财运。八字报来——年月日时，缺一不可。阳历阴历都行，我脑子比万年历快。",
  },
  { id: "u1", role: "user", type: "text", text: "1998 年 8 月 8 日上午 9 点。" },
  { id: "m4", role: "master", type: "text", text: "行，我排出来了。但天机太重，我先给你漏 30%。" },
  { id: "m5", role: "master", type: "card", card: { kind: "seal", unlocked: 30 } },
  {
    id: "m6",
    role: "master",
    type: "text",
    text: "命宫主星是紫微，身宫在财帛。底子不错，但剩下的大运流年、四化飞星、三方四正，都还封着。要解？",
  },
  {
    id: "m7",
    role: "master",
    type: "text",
    text: "行，嘴硬。那我先送你一次今日问事。事业、姻缘、财运，选一个。",
  },
];

export const replyByTopic: Record<
  string,
  { reading: { title: string; topic: string; body: string }; followup?: "sub" | "shop" | "box" }
> = {
  问财运: {
    reading: {
      title: "今日问事 · 财运",
      topic: "偏财星动",
      body: "今日你偏财星动，但别乱投。适合收款、谈价、清旧账，不适合冲动消费。尤其别买第 4 杯奶茶，那叫破财。",
    },
    followup: "sub",
  },
  问事业: {
    reading: {
      title: "今日问事 · 事业",
      topic: "迁移宫吉",
      body: "今日流日财星入迁移宫，利外部合作，但忌临时改价。下午 15:00-17:00 是你的谈判窗口。",
    },
    followup: "shop",
  },
  问姻缘: {
    reading: {
      title: "今日问事 · 姻缘",
      topic: "红鸾在侧",
      body: "红鸾轻动，但桃花掺着烂桃花。今天少在群里发表情包讨好别人，眼缘比嘴甜更管用。",
    },
    followup: "sub",
  },
  看今日: {
    reading: {
      title: "今日流日 · 综合",
      topic: "火星临命",
      body: "23:17 火星入命宫，脾气易爆。少回工作群消息，多喝水。今日颜色：墨紫；忌方位：正西。",
    },
  },
  抽灵签: {
    reading: {
      title: "灵签 · 第二十八签",
      topic: "中上签 · 月照寒潭",
      body: "事虽未明，路已生光。慢一步，福报反深。今日宜：静坐、复盘、回旧友消息。",
    },
    followup: "box",
  },
  发八字: {
    reading: {
      title: "八字速断",
      topic: "戊寅日柱",
      body: "日主偏弱，喜火土。今年走伤官大运，宜创作、表达、出名；忌冲动签字。完整精批需解封命盘。",
    },
  },
  上传面相: {
    reading: {
      title: "面相速读",
      topic: "印堂微亮",
      body: "印堂气色回暖，近日有小贵人。但卧蚕发黑，说明你又熬夜了。再熬，财星也救不了你。",
    },
  },
};
