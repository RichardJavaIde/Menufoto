//src/lib/menu-data.ts
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { toImageInfo } from "@/lib/media";
import type { Appearance } from "@/themes/resolve";
import type { MenuCategory } from "@/components/menu/types";
import type { HourRow } from "@/lib/hours";

export const getMenuData = cache(async () => {
  const [settings, hours, categories] = await Promise.all([
    prisma.restaurantSettings.findUnique({
      where: { id: 1 },
      include: { logo: true, cover: true },
    }),
    prisma.openingHour.findMany({ orderBy: { dayOfWeek: "asc" } }),
    // Solo categorías activas que tengan al menos un plato visible
    prisma.category.findMany({
      where: { active: true, dishes: { some: { visible: true } } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        dishes: {
          where: { visible: true },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          include: {
            image: true,
            tags: { orderBy: { sortOrder: "asc" }, select: { id: true, name: true, icon: true } },
          },
        },
      },
    }),
  ]);

  const appearance: Appearance = {
    themeId: settings?.themeId ?? "elegante",
    colorPrimary: settings?.colorPrimary ?? null,
    colorAccent: settings?.colorAccent ?? null,
    colorBackground: settings?.colorBackground ?? null,
    colorText: settings?.colorText ?? null,
    fontHeading: settings?.fontHeading ?? null,
    fontBody: settings?.fontBody ?? null,
  };

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

  return {
    restaurant: {
      name: settings?.name ?? "Mi Restaurante",
      tagline: settings?.tagline ?? null,
      description: settings?.description ?? null,
      address: settings?.address ?? null,
      phone: settings?.phone ?? null,
      whatsapp: settings?.whatsapp ?? null,
      email: settings?.email ?? null,
      instagram: settings?.instagram ?? null,
      facebook: settings?.facebook ?? null,
      website: settings?.website ?? null,
      currencySymbol: settings?.currencySymbol ?? "RD$",
      logo: settings?.logo ? toImageInfo(settings.logo) : null,
      cover: settings?.cover ? toImageInfo(settings.cover) : null,
    },
    appearance,
    hours: hours.map<HourRow>((h) => ({
      dayOfWeek: h.dayOfWeek,
      opensAt: h.opensAt,
      closesAt: h.closesAt,
      closed: h.closed,
    })),
    categories: menu,
  };
});