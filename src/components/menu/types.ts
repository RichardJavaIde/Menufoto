//src/components/menu/types.ts
import type { ImageInfo } from "@/lib/media";

export type MenuTag = { id: string; name: string; icon: string | null };

export type MenuDish = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  available: boolean;
  tags: MenuTag[];
  image: ImageInfo | null;
};

export type MenuCategory = {
  id: string;
  name: string;
  description: string | null;
  dishes: MenuDish[];
};