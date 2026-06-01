export type BotIntent =
  | "daily"
  | "love"
  | "money"
  | "work"
  | "draw"
  | "blindbox"
  | "inscription"
  | "operator"
  | "promo"
  | "earnings"
  | "my"
  | "help"
  | "chat";

export type BotCommand = {
  intents: BotIntent[];
  keywords: RegExp[];
  label: string;
  description: string;
  menuLabel?: string;
  requiresOperator?: boolean;
};

export const COMMANDS: BotCommand[] = [
  {
    intents: ["daily"],
    keywords: [/今日|运势|流日/],
    label: "今日",
    description: "查看今日运势与避坑建议",
    menuLabel: "今日运势",
  },
  {
    intents: ["love"],
    keywords: [/感情|姻缘|复合|对象/],
    label: "感情",
    description: "问姻缘与桃花局",
    menuLabel: "感情运势",
  },
  {
    intents: ["money"],
    keywords: [/财|钱|副业|收入/],
    label: "财运",
    description: "问今日财气与起运",
    menuLabel: "财运运势",
  },
  {
    intents: ["work"],
    keywords: [/工作|事业|老板|合作|跳槽/],
    label: "工作",
    description: "问事业与谈判窗口",
    menuLabel: "工作运势",
  },
  {
    intents: ["draw"],
    keywords: [/抽签|签/],
    label: "抽签",
    description: "叩问灵签、解惑吉凶",
    menuLabel: "抽灵签",
  },
  {
    intents: ["blindbox"],
    keywords: [/盲盒|抽/],
    label: "盲盒",
    description: "开启命师盲盒入口",
    menuLabel: "命师盲盒",
  },
  {
    intents: ["inscription"],
    keywords: [/铭文|装备/],
    label: "铭文",
    description: "查看装配的命盘铭文",
    menuLabel: "铭文装配",
  },
  {
    intents: ["operator"],
    keywords: [/命铺|经营|掌柜|899/],
    label: "命铺",
    description: "查看经营者详情",
    menuLabel: "命铺经营者",
  },
  {
    intents: ["promo"],
    keywords: [/推广|朋友圈|文案|生成图/],
    label: "推广",
    description: "经营者获取今日朋友圈推广素材",
    menuLabel: "推广素材",
    requiresOperator: true,
  },
  {
    intents: ["earnings"],
    keywords: [/收益|香火|业绩/],
    label: "收益",
    description: "查看经营收益与香火值",
    menuLabel: "经营收益",
    requiresOperator: true,
  },
  {
    intents: ["my"],
    keywords: [/我的|背包|账户|资产/],
    label: "我的",
    description: "查看账户与当前命理资产",
    menuLabel: "我的账户",
  },
  {
    intents: ["help"],
    keywords: [/帮助|help|菜单/],
    label: "帮助",
    description: "查看全部可用指令",
    menuLabel: "帮助菜单",
  },
];

export const MENU_ITEMS_USER: { label: string; description: string }[] = [
  { label: "1", description: "今日运势" },
  { label: "2", description: "感情运势" },
  { label: "3", description: "财运运势" },
  { label: "4", description: "工作运势" },
  { label: "5", description: "抽灵签" },
  { label: "6", description: "命师盲盒" },
  { label: "7", description: "铭文装配" },
  { label: "8", description: "命铺经营者" },
  { label: "9", description: "我的账户" },
  { label: "0", description: "帮助菜单" },
];

export const MENU_ITEMS_OPERATOR: { label: string; description: string }[] = [
  { label: "1", description: "今日运势" },
  { label: "2", description: "感情运势" },
  { label: "3", description: "财运运势" },
  { label: "4", description: "工作运势" },
  { label: "5", description: "抽灵签" },
  { label: "6", description: "命师盲盒" },
  { label: "7", description: "铭文装配" },
  { label: "8", description: "推广素材" },
  { label: "9", description: "经营收益" },
  { label: "0", description: "帮助菜单" },
];

export const DIGIT_MENU_MAP_USER: Record<string, BotIntent> = {
  "1": "daily",
  "2": "love",
  "3": "money",
  "4": "work",
  "5": "draw",
  "6": "blindbox",
  "7": "inscription",
  "8": "operator",
  "9": "my",
  "0": "help",
};

export const DIGIT_MENU_MAP_OPERATOR: Record<string, BotIntent> = {
  "1": "daily",
  "2": "love",
  "3": "money",
  "4": "work",
  "5": "draw",
  "6": "blindbox",
  "7": "inscription",
  "8": "promo",
  "9": "earnings",
  "0": "help",
};
