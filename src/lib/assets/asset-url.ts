import { assetManifest } from "./asset-manifest.generated";
import type { AssetManifestItem, AssetVariant, AssetVariantFile } from "./asset-types";

export function getAsset(assetId: string): AssetManifestItem {
  const asset = assetManifest[assetId as keyof typeof assetManifest] as
    | AssetManifestItem
    | undefined;
  if (!asset) {
    throw new Error(`Unknown art asset: ${assetId}`);
  }
  return asset;
}

export function pickVariant(asset: AssetManifestItem, variant: AssetVariant): AssetVariantFile {
  const file = asset.variants[variant];
  if (!file) {
    const available = Object.keys(asset.variants).join(", ") || "none";
    throw new Error(`Asset ${asset.id} does not have variant ${variant}. Available: ${available}`);
  }
  return file;
}

export function getAssetUrl(assetId: string, variant: AssetVariant): string {
  return pickVariant(getAsset(assetId), variant).url;
}
