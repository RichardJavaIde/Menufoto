//src/components/ui/dish-image.tsx
import { ImageIcon } from "lucide-react";
import { mediaUrl, type ImageInfo } from "@/lib/media";

export function DishThumb({
  image,
  className = "h-16 w-16",
}: {
  image: ImageInfo | null;
  className?: string;
}) {
  if (!image) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-400 ${className}`}
      >
        <ImageIcon className="h-5 w-5" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mediaUrl(image.key, 480)}
      alt=""
      loading="lazy"
      decoding="async"
      className={`shrink-0 rounded-lg object-cover ${className}`}
    />
  );
}