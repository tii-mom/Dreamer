import type { AssetVariant } from "./asset-types";

export const imageSizes: Partial<Record<AssetVariant, string>> = {
  avatar_sm: "64px",
  avatar_md: "96px",
  avatar_lg: "192px",
  icon: "96px",
  thumb: "(max-width: 768px) 96px, 160px",
  list: "(max-width: 768px) 140px, 220px",
  card: "(max-width: 768px) 72vw, 360px",
  full: "(max-width: 768px) 90vw, 512px",
  box: "(max-width: 768px) 56vw, 260px",
  frame: "(max-width: 768px) 56vw, 260px",
  mobile: "(max-width: 768px) 80vw, 360px",
  share: "(max-width: 768px) 90vw, 540px",
};
