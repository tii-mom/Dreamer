export type ProductCode =
  | "seal_unlock"
  | "operator_899"
  | "blindbox_single"
  | "blindbox_ten"
  | "qiyun_topup";

export type PayType = "alipay" | "wechat";

export type ProductDefinition = {
  code: ProductCode;
  name: string;
  priceCents: number;
  description?: string;
  /** Hidden from v1 main SKU list but kept for future use */
  hidden?: boolean;
};

export const PRODUCTS: Record<ProductCode, ProductDefinition> = {
  seal_unlock: {
    code: "seal_unlock",
    name: "解封命盘",
    priceCents: 599,
    description: "完整 HTML 命盘、大运流年、四化飞星、三方四正",
  },
  operator_899: {
    code: "operator_899",
    name: "命铺经营者",
    priceCents: 89900,
    description: "专属命铺链接、朋友圈文案、铭文卡槽+2、香火值活动权益",
  },
  blindbox_single: {
    code: "blindbox_single",
    name: "命师盲盒单抽",
    priceCents: 9900,
    description: "随机获取 1 个铭文道具或命理碎片",
  },
  blindbox_ten: {
    code: "blindbox_ten",
    name: "命师盲盒十连抽",
    priceCents: 88800,
    description: "批量获取 10 个铭文道具，保底史诗",
  },
  qiyun_topup: {
    code: "qiyun_topup",
    name: "供奉香火",
    priceCents: 0,
    description: "自定义金额充值气运",
  },
};

export function getProduct(code: ProductCode): ProductDefinition {
  const product = PRODUCTS[code];
  if (!product) {
    throw new Error(`未知商品: ${code}`);
  }
  return product;
}

export function formatPrice(priceCents: number): string {
  return (priceCents / 100).toFixed(2);
}
