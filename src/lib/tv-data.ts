//src/lib/tv-data.ts
import { prisma } from "@/lib/prisma";
import type { Appearance } from "@/themes/resolve";
import type { TvCategory, TvDish, TvSlideConfig } from "@/lib/tv-frames";

export async function getTvData(token: string) {
  // Los tokens generados tienen 32 caracteres; esto evita consultas con basura
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;

  const screen = await prisma.tvScreen.findUnique({
    where: { token },
    include: { slides: { where: { active: true }, orderBy: { position: "asc" } } },
  });
  if (!screen) return null;
  if (!screen.active) return { status: "inactive" as const, name: screen.name };

  const [settings, categories, dishes] = await Promise.all([
    prisma.restaurantSettings.findUnique({ where: { id: 1 }, include: { logo: true } }),
    prisma.category.findMany({
      where: { active: true, dishes: { some: { visible: true } } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.dish.findMany({
      where: { visible: true, category: { active: true } },
      orderBy: [
        { category: { sortOrder: "asc" } },
        { sortOrder: "asc" },
        { createdAt: "asc" },
      ],
      include: { image: true },
    }),
  ]);

  // Última conexión (el "latido" completo llega en la Fase 3)
  prisma.tvScreen
    .update({ where: { id: screen.id }, data: { lastSeenAt: new Date() } })
    .catch((e) => console.error(e));

  const appearance: Appearance = {
    themeId: settings?.themeId ?? "elegante",
    colorPrimary: settings?.colorPrimary ?? null,
    colorAccent: settings?.colorAccent ?? null,
    colorBackground: settings?.colorBackground ?? null,
    colorText: settings?.colorText ?? null,
    fontHeading: settings?.fontHeading ?? null,
    fontBody: settings?.fontBody ?? null,
  };

  const tvSlides: TvSlideConfig[] = screen.slides.map((s) => ({
    id: s.id,
    type: s.type,
    seconds: s.seconds,
    effect: s.effect,
    days: s.days,
    startMinute: s.startMinute,
    endMinute: s.endMinute,
    categoryId: s.categoryId,
  }));

  const tvDishes: TvDish[] = dishes.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    priceCents: d.priceCents,
    available: d.available,
    popular: d.popular,
    categoryId: d.categoryId,
    imageKey: d.image?.fileKey ?? null,
    offerCents: d.offerPriceCents,
    offerStartMs: d.offerStart ? d.offerStart.getTime() : null,
    offerEndMs: d.offerEnd ? d.offerEnd.getTime() : null,
  }));

  const tvCategories: TvCategory[] = categories;

  return {
    status: "ok" as const,
    appearance,
    restaurantName: settings?.name ?? "Mi Restaurante",
    logoKey: settings?.logo?.fileKey ?? null,
    currencySymbol: settings?.currencySymbol ?? "RD$",
    timezone: settings?.timezone ?? "America/Santo_Domingo",
    serverNowMs: Date.now(),
    slides: tvSlides,
    dishes: tvDishes,
    categories: tvCategories,
  };
}