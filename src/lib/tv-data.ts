//src/lib/tv-data.ts
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { Appearance } from "@/themes/resolve";
import type { TvCategory, TvDish, TvPayload, TvSlideConfig } from "@/lib/tv-frames";

// Cambia cada vez que el servidor se reinicia (por ejemplo, al actualizar la imagen Docker).
// Las pantallas lo comparan y se recargan solas cuando cambia.
const g = globalThis as unknown as { __tvBootId?: string };
g.__tvBootId ??= Date.now().toString(36);
export const BOOT_ID: string = g.__tvBootId;

const SEEN_EVERY_MS = 60_000;

export async function getTvData(token: string) {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(token)) return null;

  const screen = await prisma.tvScreen.findUnique({
    where: { token },
    include: {
      slides: {
        where: { active: true },
        orderBy: { position: "asc" },
        include: {
          images: {
            orderBy: { position: "asc" },
            include: { image: { select: { fileKey: true } } },
          },
        },
      },
    },
  });
  if (!screen) return null;

  // Última conexión: se guarda como máximo una vez por minuto
  if (!screen.lastSeenAt || Date.now() - screen.lastSeenAt.getTime() > SEEN_EVERY_MS) {
    prisma.tvScreen
      .update({ where: { id: screen.id }, data: { lastSeenAt: new Date() } })
      .catch((e) => console.error(e));
  }

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

  const appearance: Appearance = {
    themeId: settings?.themeId ?? "elegante",
    colorPrimary: settings?.colorPrimary ?? null,
    colorAccent: settings?.colorAccent ?? null,
    colorBackground: settings?.colorBackground ?? null,
    colorText: settings?.colorText ?? null,
    fontHeading: settings?.fontHeading ?? null,
    fontBody: settings?.fontBody ?? null,
  };

  const slides: TvSlideConfig[] = screen.slides.map((s) => ({
    id: s.id,
    type: s.type,
    seconds: s.seconds,
    effect: s.effect,
    days: s.days,
    startMinute: s.startMinute,
    endMinute: s.endMinute,
    categoryId: s.categoryId,
    galleryMode: s.galleryMode,
    imageKeys: s.images.map((img) => img.image.fileKey),
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
    slides,
    dishes: tvDishes,
    categories: tvCategories,
  };
}

type TvOk = Extract<NonNullable<Awaited<ReturnType<typeof getTvData>>>, { status: "ok" }>;

export function tvPayload(d: TvOk): TvPayload {
  return {
    bootId: BOOT_ID,
    appearanceKey: JSON.stringify(d.appearance),
    restaurantName: d.restaurantName,
    logoKey: d.logoKey,
    currencySymbol: d.currencySymbol,
    timezone: d.timezone,
    slides: d.slides,
    dishes: d.dishes,
    categories: d.categories,
  };
}

// Huella del contenido: si no cambió nada, el servidor responde 304 sin enviar datos
export function tvEtag(d: TvOk) {
  const hash = createHash("sha1").update(JSON.stringify(tvPayload(d))).digest("hex");
  return `"${hash}"`;
}