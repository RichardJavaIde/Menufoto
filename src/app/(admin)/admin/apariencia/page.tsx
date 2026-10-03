//src/app/(admin)/admin/apariencia/page.tsx
import { prisma } from "@/lib/prisma";
import { requireSection } from "@/lib/auth";
import { toImageInfo } from "@/lib/media";
import { ALL_FONT_VARIABLES } from "@/themes/fonts";
import { getTheme } from "@/themes/definitions";
import { AppearanceEditor } from "@/components/admin/appearance/appearance-editor";
import type { MenuCategory } from "@/components/menu/types";

export default async function AparienciaPage() {
  await requireSection("apariencia"); // solo ADMIN

  const [settings, categories] = await Promise.all([
    prisma.restaurantSettings.findUnique({ where: { id: 1 } }),
    // Muestra real para la vista previa: 2 categorías con hasta 3 platos visibles cada una
    prisma.category.findMany({
      where: { active: true, dishes: { some: { visible: true } } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: 2,
      include: {
        dishes: {
          where: { visible: true },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          take: 3,
          include: {
            image: true,
            tags: { orderBy: { sortOrder: "asc" }, select: { id: true, name: true, icon: true } },
          },
        },
      },
    }),
  ]);

  const menu: MenuCategory[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    dishes: c.dishes.map((d) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      priceCents: d.priceCents,
      available: d.available,
      tags: d.tags,
      image: d.image ? toImageInfo(d.image) : null,
    })),
  }));

  return (
    // Estas clases dejan disponibles todas las tipografías para poder previsualizarlas
    <div className={ALL_FONT_VARIABLES}>
      <AppearanceEditor
        initial={{
          themeId: getTheme(settings?.themeId ?? "elegante").id,
          colorPrimary: settings?.colorPrimary ?? null,
          colorAccent: settings?.colorAccent ?? null,
          colorBackground: settings?.colorBackground ?? null,
          colorText: settings?.colorText ?? null,
          fontHeading: settings?.fontHeading ?? null,
          fontBody: settings?.fontBody ?? null,
        }}
        categories={menu}
        currencySymbol={settings?.currencySymbol ?? "RD$"}
        restaurantName={settings?.name ?? "Mi Restaurante"}
        tagline={settings?.tagline ?? null}
        hasRealPhotos={menu.some((c) => c.dishes.some((d) => d.image))}
      />
    </div>
  );
}