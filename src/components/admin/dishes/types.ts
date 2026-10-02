//src/components/admin/dishes/types.ts
export type DishRow = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  visible: boolean;
  available: boolean;
  categoryId: string;
  tagIds: string[];
};

export type CategoryOption = { id: string; name: string; active: boolean };

export type TagOption = { id: string; name: string; icon: string | null };