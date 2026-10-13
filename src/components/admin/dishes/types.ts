//src/components/admin/dishes/types.ts
import type { ImageInfo } from "@/lib/media";

export type DishRow = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  visible: boolean;
  available: boolean;
  popular: boolean;
  offerPriceCents: number | null;
  offerStart: string | null; // YYYY-MM-DD en la zona del restaurante
  offerEnd: string | null;
  categoryId: string;
  tagIds: string[];
  image: ImageInfo | null;
};

export type CategoryOption = { id: string; name: string; active: boolean };

export type TagOption = { id: string; name: string; icon: string | null };