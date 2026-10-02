//src/components/admin/categories/types.ts
export type CategoryRow = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  dishCount: number;
};