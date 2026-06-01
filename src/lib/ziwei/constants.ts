/**
 * 紫微斗数常量表
 * 来源：https://github.com/Renhuai123/ziwei-doushu
 */

export const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];

export const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

export const SHICHEN = [
  { branch: 0, name: "子时", range: "23:00-01:00" },
  { branch: 1, name: "丑时", range: "01:00-03:00" },
  { branch: 2, name: "寅时", range: "03:00-05:00" },
  { branch: 3, name: "卯时", range: "05:00-07:00" },
  { branch: 4, name: "辰时", range: "07:00-09:00" },
  { branch: 5, name: "巳时", range: "09:00-11:00" },
  { branch: 6, name: "午时", range: "11:00-13:00" },
  { branch: 7, name: "未时", range: "13:00-15:00" },
  { branch: 8, name: "申时", range: "15:00-17:00" },
  { branch: 9, name: "酉时", range: "17:00-19:00" },
  { branch: 10, name: "戌时", range: "19:00-21:00" },
  { branch: 11, name: "亥时", range: "21:00-23:00" },
];

export const PALACE_NAMES_ORDER = [
  "命宫",
  "兄弟宫",
  "夫妻宫",
  "子女宫",
  "财帛宫",
  "疾厄宫",
  "迁移宫",
  "交友宫",
  "官禄宫",
  "田宅宫",
  "福德宫",
  "父母宫",
];

export const NAYIN_ELEMENTS = [
  "金",
  "火",
  "木",
  "土",
  "金",
  "火",
  "水",
  "土",
  "金",
  "木",
  "水",
  "土",
  "火",
  "木",
  "水",
  "金",
  "火",
  "木",
  "土",
  "金",
  "火",
  "水",
  "土",
  "金",
  "木",
  "水",
  "土",
  "火",
  "木",
  "水",
];

export const ELEMENT_TO_JU: Record<string, number> = {
  水: 2,
  木: 3,
  金: 4,
  土: 5,
  火: 6,
};

export const JU_NAMES: Record<number, string> = {
  2: "水二局",
  3: "木三局",
  4: "金四局",
  5: "土五局",
  6: "火六局",
};

export const SI_HUA_TABLE: Record<number, [string, string, string, string]> = {
  0: ["廉贞", "破军", "武曲", "太阳"],
  1: ["天机", "天梁", "紫微", "太阴"],
  2: ["天同", "天机", "文昌", "廉贞"],
  3: ["太阴", "天同", "天机", "巨门"],
  4: ["贪狼", "太阴", "右弼", "天机"],
  5: ["武曲", "贪狼", "天梁", "文曲"],
  6: ["太阳", "武曲", "太阴", "天同"],
  7: ["巨门", "太阳", "文曲", "文昌"],
  8: ["天梁", "紫微", "左辅", "武曲"],
  9: ["破军", "巨门", "太阴", "贪狼"],
};

export const TIANKUI_TABLE: Record<number, [number, number]> = {
  0: [1, 7],
  1: [0, 8],
  2: [11, 9],
  3: [11, 9],
  4: [1, 7],
  5: [0, 8],
  6: [1, 7],
  7: [6, 2],
  8: [3, 5],
  9: [3, 5],
};

export const LUCUN_TABLE: Record<number, number> = {
  0: 2,
  1: 3,
  2: 5,
  3: 6,
  4: 5,
  5: 6,
  6: 8,
  7: 9,
  8: 11,
  9: 0,
};

export const TIANMA_TABLE: Record<number, number> = {
  2: 8,
  6: 8,
  10: 8,
  8: 2,
  0: 2,
  4: 2,
  5: 11,
  9: 11,
  1: 11,
  11: 5,
  3: 5,
  7: 5,
};

export const STAR_BRIGHTNESS: Record<string, Record<number, string>> = {
  紫微: {
    2: "bright",
    5: "bright",
    8: "bright",
    11: "bright",
    1: "normal",
    4: "normal",
    7: "bright",
    10: "normal",
    0: "normal",
    3: "dim",
    6: "dim",
    9: "normal",
  },
  天机: {
    5: "bright",
    11: "bright",
    3: "bright",
    9: "bright",
    1: "normal",
    7: "normal",
    2: "dim",
    8: "dim",
    0: "normal",
    4: "normal",
    6: "normal",
    10: "normal",
  },
  太阳: {
    3: "bright",
    4: "bright",
    5: "bright",
    6: "bright",
    7: "normal",
    8: "normal",
    9: "normal",
    10: "dim",
    11: "dim",
    0: "dim",
    1: "dim",
    2: "normal",
  },
  武曲: {
    2: "bright",
    5: "bright",
    8: "bright",
    11: "bright",
    0: "normal",
    3: "normal",
    6: "normal",
    9: "normal",
    1: "dim",
    4: "dim",
    7: "dim",
    10: "dim",
  },
  天同: {
    0: "bright",
    3: "bright",
    6: "bright",
    9: "bright",
    2: "normal",
    5: "normal",
    8: "normal",
    11: "normal",
    1: "dim",
    4: "dim",
    7: "dim",
    10: "dim",
  },
  廉贞: {
    2: "bright",
    5: "bright",
    8: "bright",
    11: "bright",
    0: "normal",
    3: "normal",
    6: "normal",
    9: "normal",
    1: "dim",
    4: "dim",
    7: "dim",
    10: "dim",
  },
};

export const STAR_DESCRIPTIONS: Record<
  string,
  { keywords: string; nature: string; element: string }
> = {
  紫微: { keywords: "帝王·尊贵·独立", nature: "中性偏吉", element: "土" },
  天机: { keywords: "智慧·机变·谋略", nature: "吉星", element: "木" },
  太阳: { keywords: "阳刚·官贵·慷慨", nature: "吉星", element: "火" },
  武曲: { keywords: "财富·刚毅·果断", nature: "中性", element: "金" },
  天同: { keywords: "温和·享福·随缘", nature: "吉星", element: "水" },
  廉贞: { keywords: "才艺·刑囚·桃花", nature: "凶中带吉", element: "火" },
  天府: { keywords: "财库·稳重·保守", nature: "吉星", element: "土" },
  太阴: { keywords: "柔美·财富·阴柔", nature: "吉星", element: "水" },
  贪狼: { keywords: "欲望·桃花·多才", nature: "中性", element: "木" },
  巨门: { keywords: "口舌·是非·善辩", nature: "凶中带吉", element: "水" },
  天相: { keywords: "辅佐·行政·印绶", nature: "吉星", element: "水" },
  天梁: { keywords: "荫护·医药·长辈", nature: "吉星", element: "土" },
  七杀: { keywords: "将星·果决·孤克", nature: "凶星", element: "金" },
  破军: { keywords: "开创·变动·破坏", nature: "凶星", element: "水" },
};
