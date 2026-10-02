//src/app/(admin)/admin/platos/page.tsx
import { prisma } from "@/lib/prisma";
import { requireSection } from "@/lib/auth";
import { DishesManager } from "@/components/admin/dishes/dishes-manager";

export default async function PlatosPage() {
  await requireSection("platos");

  const [categories, tags, dishes, settings] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true, active: true },
    }),
    prisma.tag.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, icon: true },
    }),
    prisma.dish.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { tags: { select: { id: true } } },
    }),
    prisma.restaurantSettings.findUnique({
      where: { id: 1 },
      select: { currencySymbol: true },
    }),
  ]);

  return (
    <DishesManager
      categories={categories}
      tags={tags}
      currencySymbol={settings?.currencySymbol ?? "RD$"}
      dishes={dishes.map((d) => ({
        id: d.id,
        name: d.name,
        description: d.description,
        priceCents: d.priceCents,
        visible: d.visible,
        available: d.available,
        categoryId: d.categoryId,
        tagIds: d.tags.map((t) => t.id),
      }))}
    />
  );
}
