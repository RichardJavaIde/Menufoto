//src/actions/settings.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSection } from "@/lib/auth";
import { deleteImageById, isImageFree } from "@/lib/images";
import type { ActionResult } from "@/lib/action-result";
import {
  identitySchema,
  contactSchema,
  currencySchema,
  hoursSchema,
} from "@/lib/schemas/settings";

const UNEXPECTED = "No se pudo guardar. Intenta de nuevo.";
const IMAGE_UNAVAILABLE = "La foto ya no está disponible. Súbela de nuevo.";

function refresh() {
  revalidatePath("/admin", "layout");
  revalidatePath("/"); // menú público
}

export async function saveIdentityAction(input: unknown): Promise<ActionResult> {
  await requireSection("configuracion");

  const parsed = identitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { name, tagline, description, logoId, coverId } = parsed.data;

  if (logoId && logoId === coverId) {
    return { ok: false, error: "El logo y la portada no pueden ser la misma imagen" };
  }

  let previousLogoId: string | null = null;
  let previousCoverId: string | null = null;

  try {
    const current = await prisma.restaurantSettings.findUnique({
      where: { id: 1 },
      select: { logoId: true, coverId: true },
    });
    previousLogoId = current?.logoId ?? null;
    previousCoverId = current?.coverId ?? null;

    if (logoId && logoId !== previousLogoId && !(await isImageFree(logoId))) {
      return { ok: false, error: IMAGE_UNAVAILABLE };
    }
    if (coverId && coverId !== previousCoverId && !(await isImageFree(coverId))) {
      return { ok: false, error: IMAGE_UNAVAILABLE };
    }

    await prisma.restaurantSettings.upsert({
      where: { id: 1 },
      update: { name, tagline, description, logoId, coverId },
      create: { id: 1, name, tagline, description, logoId, coverId },
    });
  } catch (e) {
    console.error(e);
    return { ok: false, error: UNEXPECTED };
  }

  // Las fotos reemplazadas o quitadas se borran de la base y del disco
  if (previousLogoId && previousLogoId !== logoId) {
    await deleteImageById(previousLogoId).catch((e) => console.error(e));
  }
  if (previousCoverId && previousCoverId !== coverId) {
    await deleteImageById(previousCoverId).catch((e) => console.error(e));
  }

  refresh();
  return { ok: true, message: "Identidad guardada correctamente" };
}

export async function saveContactAction(input: unknown): Promise<ActionResult> {
  await requireSection("configuracion");

  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  try {
    await prisma.restaurantSettings.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });
  } catch (e) {
    console.error(e);
    return { ok: false, error: UNEXPECTED };
  }

  refresh();
  return { ok: true, message: "Contacto y redes guardados correctamente" };
}

export async function saveCurrencyAction(input: unknown): Promise<ActionResult> {
  await requireSection("configuracion");

  const parsed = currencySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  try {
    await prisma.restaurantSettings.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });
  } catch (e) {
    console.error(e);
    return { ok: false, error: UNEXPECTED };
  }

  refresh();
  return { ok: true, message: "Moneda guardada correctamente" };
}

export async function saveHoursAction(input: unknown): Promise<ActionResult> {
  await requireSection("configuracion");

  const parsed = hoursSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  try {
    await prisma.$transaction([
      prisma.openingHour.deleteMany(),
      prisma.openingHour.createMany({
        data: parsed.data.hours.map((h) => ({
          dayOfWeek: h.dayOfWeek,
          closed: h.closed,
          opensAt: h.closed ? null : h.opensAt,
          closesAt: h.closed ? null : h.closesAt,
        })),
      }),
    ]);
  } catch (e) {
    console.error(e);
    return { ok: false, error: UNEXPECTED };
  }

  refresh();
  return { ok: true, message: "Horario guardado correctamente" };
}