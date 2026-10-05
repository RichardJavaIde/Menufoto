//src/lib/media.ts
export type ImageInfo = {
  id: string;
  key: string;
  width: number;
  height: number;
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
};

export type MediaSize = 480 | 960 | "src";
const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? "";
export function mediaUrl(key: string, size: MediaSize) {
  return `${MEDIA_BASE}/media/${key}-${size}.webp`;
}

export function mediaSrcSet(key: string) {
  return `${mediaUrl(key, 480)} 480w, ${mediaUrl(key, 960)} 960w`;
}

// Proporción (ancho / alto) de la foto ya recortada
export function cropAspect(image: ImageInfo) {
  return (image.cropWidth * image.width) / (image.cropHeight * image.height);
}

export function toImageInfo(image: {
  id: string;
  fileKey: string;
  width: number;
  height: number;
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
}): ImageInfo {
  return {
    id: image.id,
    key: image.fileKey,
    width: image.width,
    height: image.height,
    cropX: image.cropX,
    cropY: image.cropY,
    cropWidth: image.cropWidth,
    cropHeight: image.cropHeight,
  };
}