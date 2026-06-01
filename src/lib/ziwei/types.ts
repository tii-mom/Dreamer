/**
 * 紫微斗数排盘类型定义
 * 来源：https://github.com/Renhuai123/ziwei-doushu
 */
export interface BirthInfo {
  year: number;
  month: number;
  day: number;
  hour: number;
  gender: "male" | "female";
  name?: string;
  province?: string;
  city?: string;
  longitude?: number;
}

export interface LunarInfo {
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  yearStem: number;
  yearBranch: number;
  isLeapMonth: boolean;
}

export type SiHua = "禄" | "权" | "科" | "忌";

export interface Star {
  name: string;
  type: "major" | "minor" | "lucky" | "sha";
  siHua?: SiHua;
  brightness?: "bright" | "normal" | "dim";
}

export interface SelfSihuaMark {
  siHua: SiHua;
  starName: string;
}

export interface Palace {
  branch: number;
  stem: number;
  name: string;
  stars: Star[];
  daXianAge?: [number, number];
  isCurrentDaXian?: boolean;
  isMingGong?: boolean;
  isShenGong?: boolean;
  selfSihua?: SelfSihuaMark[];
  oppositeBranch?: number;
  isEmpty?: boolean;
  borrowedFromBranch?: number;
  borrowedFromName?: string;
  borrowedStars?: string[];
}

export interface DaXianSiHua {
  stemIndex: number;
  stemName: string;
  lu: string;
  quan: string;
  ke: string;
  ji: string;
}

export interface DaXian {
  startAge: number;
  endAge: number;
  palaceBranch: number;
  palaceName: string;
  stemIndex?: number;
  stemName?: string;
  siHua?: DaXianSiHua;
}

export interface ZiweiChart {
  birthInfo: BirthInfo;
  lunarInfo: LunarInfo;
  mingGongBranch: number;
  shenGongBranch: number;
  wuxingJu: number;
  wuxingJuName: string;
  ziweiPos: number;
  palaces: Palace[];
  daXians: DaXian[];
  currentAge: number;
  currentDaXianIndex: number;
}
