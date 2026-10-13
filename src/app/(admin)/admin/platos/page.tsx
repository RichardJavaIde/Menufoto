//src/app/(admin)/admin/platos/page.tsx
import { prisma } from "@/lib/prisma";
import { requireSection } from "@/lib/auth";
import { toImageInfo } from "@/lib/media";
import { utcToZonedDateStr } from "@/lib/tz";
import { DishesManager } from "@/components/admin/dishes/dishes-manager";

export default async function PlatosPage() {
  const user = await requireSection("platos");

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
      include: { tags: { select: { id: true } }, image: true },
    }),
    prisma.restaurantSettings.findUnique({
      where: { id: 1 },
      select: { currencySymbol: true, timezone: true },
    }),
  ]);

  const tz = settings?.timezone ?? "America/Santo_Domingo";

  return (
    <DishesManager
      categories={categories}
      tags={tags}
      currencySymbol={settings?.currencySymbol ?? "RD$"}
      canManageTv={user.role === "ADMIN"}
      dishes={dishes.map((d) => ({
        id: d.id,
        name: d.name,
        description: d.description,
        priceCents: d.priceCents,
        visible: d.visible,
        available: d.available,
        popular: d.popular,
        offerPriceCents: d.offerPriceCents,
        offerStart: d.offerStart ? utcToZonedDateStr(d.offerStart, tz) : null,
        offerEnd: d.offerEnd ? utcToZonedDateStr(d.offerEnd, tz) : null,
        categoryId: d.categoryId,
        tagIds: d.tags.map((t) => t.id),
        image: d.image ? toImageInfo(d.image) : null,
      }))}
    />
  );
}