import type { ImgHTMLAttributes } from "react";
import { getAsset, pickVariant } from "@/lib/assets/asset-url";
import { imageSizes } from "@/lib/assets/image-presets";
import type { AssetVariant } from "@/lib/assets/asset-types";

type Props = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "srcSet" | "width" | "height" | "loading" | "decoding"
> & {
  assetId: string;
  variant?: AssetVariant;
  priority?: boolean;
  sizes?: string;
};

export function AssetImage({
  assetId,
  variant = "thumb",
  priority = false,
  alt,
  sizes,
  style,
  ...imgProps
}: Props) {
  const asset = getAsset(assetId);
  const file = pickVariant(asset, variant);

  return (
    <img
      {...imgProps}
      src={file.url}
      width={file.width}
      height={file.height}
      alt={alt ?? asset.name}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      sizes={sizes ?? imageSizes[variant]}
      draggable={imgProps.draggable ?? false}
      style={{
        backgroundColor: asset.dominantColor,
        aspectRatio: `${file.width} / ${file.height}`,
        ...style,
      }}
    />
  );
}
