//src/app/(admin)/admin/etiquetas/page.tsx
import { prisma } from "@/lib/prisma";
import { requireSection } from "@/lib/auth";
import { TagsManager } from "@/components/admin/tags/tags-manager";

export default async function EtiquetasPage() {
  await requireSection("etiquetas");

  const tags = await prisma.tag.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { dishes: true } } },
  });

  return (
    <TagsManager
      tags={tags.map((t) => ({
        id: t.id,
        name: t.name,
        icon: t.icon,
        dishCount: t._count.dishes,
      }))}
    />
  );
}
