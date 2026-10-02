//src/app/(admin)/admin/categorias/page.tsx
import { prisma } from "@/lib/prisma";
import { requireSection } from "@/lib/auth";
import { CategoriesManager } from "@/components/admin/categories/categories-manager";

export default async function CategoriasPage() {
  await requireSection("categorias");

  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { dishes: true } } },
  });

  return (
    <CategoriesManager
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        active: c.active,
        dishCount: c._count.dishes,
      }))}
    />
  );
}