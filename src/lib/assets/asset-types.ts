export type AssetKind =
  | "master"
  | "master_avatar"
  | "blind_box"
  | "blind_box_effect"
  | "blind_box_result"
  | "rune"
  | "share"
  | "marketing"
  | "ui";

export type AssetVariant =
  | "icon"
  | "avatar_sm"
  | "avatar_md"
  | "avatar_lg"
  | "thumb"
  | "list"
  | "card"
  | "full"
  | "box"
  | "frame"
  | "mobile"
  | "share"
  | "raw";

export type AssetRarity = "trainee" | "renji" | "dixuan" | "tianshu" | "chaos" | "silver" | "gold";

export type AssetVariantFile = {
  url: string;
  width: number;
  height: number;
  bytes: number;
  format: "webp" | "avif" | "png" | "svg";
};

export type AssetManifestItem = {
  id: string;
  kind: AssetKind;
  rarity?: AssetRarity;
  name: string;
  specialty?: string;
  aspectRatio: number;
  dominantColor?: string;
  blurDataUrl?: string;
  variants: Partial<Record<AssetVariant, AssetVariantFile>>;
};

export type AssetManifest = Record<string, AssetManifestItem>;
