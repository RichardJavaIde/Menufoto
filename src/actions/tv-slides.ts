//src/actions/tv-slides.ts
"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSection } from "@/lib/auth";
import { deleteImageById, isImageFree } from "@/lib/images";
import { GALLERY_LIMITS } from "@/lib/tv-frames";
import type { ActionResult } from "@/lib/action-result";
import {
  createSlideSchema,
  updateSlideSchema,
  slideIdSchema,
  moveSlideSchema,
} from "@/lib/schemas/tv-slide";

const IMAGE_UNAVAILABLE = "Una imagen ya no está disponible. Súbela de nuevo.";

function dbError(e: unknown): ActionResult {
  if (
    e instanceof Prisma.PrismaClientKnownRequestError &&
    (e.code === "P2025" || e.code === "P2003")
  ) {
    return { ok: false, error: "La diapositiva, la pantalla o la categoría ya no existe" };
  }
  console.error(e);
  return { ok: false, error: "Ocurrió un error inesperado. Intenta de nuevo." };
}

function refresh() {
  revalidatePath("/admin", "layout");
}

// [] o los 7 días = todos los días (null); si no, un número con un bit por día (0 = domingo)
function daysToMask(days: number[]): number | null {
  const set = new Set(days);
  if (set.size === 0 || set.size === 7) return null;
  let mask = 0;
  for (const d of set) mask |= 1 << d;
  return mask;
}

function timeToMinutes(value: string) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

export async function createSlideAction(input: unknown): Promise<ActionResult> {
  await requireSection("tv");

  const parsed = createSlideSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { screenId, type, categoryId } = parsed.data;

  try {
    const screen = await prisma.tvScreen.findUnique({
      where: { id: screenId },
      select: { id: true },
    });
    if (!screen) return { ok: false, error: "La pantalla ya no existe" };

    const last = await prisma.tvSlide.aggregate({
      where: { screenId },
      _max: { position: true },
    });

    await prisma.tvSlide.create({
      data: {
        screenId,
        type,
        position: (last._max.position ?? -1) + 1,
        seconds: type === "CATEGORY" ? 15 : type === "GALLERY" ? 8 : 12,
        categoryId: type === "CATEGORY" ? categoryId : null,
      },
    });
  } catch (e) {
    return dbError(e);
  }

  refresh();
  return {
    ok: true,
    message:
      type === "GALLERY"
        ? "Galería creada. Edítala para subir las imágenes."
        : "Diapositiva agregada",
  };
}

export async function updateSlideAction(input: unknown): Promise<ActionResult> {
  await requireSection("tv");

  const parsed = updateSlideSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { id, seconds, effect, active, days, start, end, categoryId, galleryMode, imageIds } =
    parsed.data;

  // Imágenes que dejan de usarse: se borran del disco después de guardar
  let removedImageIds: string[] = [];

  try {
    const slide = await prisma.tvSlide.findUnique({
      where: { id },
      select: { type: true, images: { select: { imageId: true } } },
    });
    if (!slide) return { ok: false, error: "La diapositiva ya no existe" };

    const base = {
      seconds,
      effect,
      active,
      days: daysToMask(days),
      startMinute: start ? timeToMinutes(start) : null,
      endMinute: end ? timeToMinutes(end) : null,
      ...(slide.type === "CATEGORY" && categoryId ? { categoryId } : {}),
    };

    if (slide.type !== "GALLERY") {
      await prisma.tvSlide.update({ where: { id }, data: base });
    } else {
      const mode = galleryMode ?? "SEQUENCE";
      const ids = imageIds ?? [];
      const limit = GALLERY_LIMITS[mode];

      if (ids.length > limit) {
        return {
          ok: false,
          error: `Este modo admite como máximo ${limit} ${
            limit === 1 ? "imagen" : "imágenes"
          }. Quita algunas.`,
        };
      }
      if (new Set(ids).size !== ids.length) {
        return { ok: false, error: "Hay una imagen repetida" };
      }

      const currentIds = slide.images.map((i) => i.imageId);
      for (const imageId of ids) {
        if (!currentIds.includes(imageId) && !(await isImageFree(imageId))) {
          return { ok: false, error: IMAGE_UNAVAILABLE };
        }
      }

      await prisma.$transaction([
        prisma.tvSlide.update({ where: { id }, data: { ...base, galleryMode: mode } }),
        prisma.tvSlideImage.deleteMany({ where: { slideId: id } }),
        prisma.tvSlideImage.createMany({
          data: ids.map((imageId, position) => ({ slideId: id, imageId, position })),
        }),
      ]);

      removedImageIds = currentIds.filter((x) => !ids.includes(x));
    }
  } catch (e) {
    return dbError(e);
  }

  for (const imageId of removedImageIds) {
    await deleteImageById(imageId).catch((e) => console.error(e));
  }

  refresh();
  return { ok: true, message: "Diapositiva actualizada" };
}

export async function toggleSlideActiveAction(input: unknown): Promise<ActionResult> {
  await requireSection("tv");

  const parsed = slideIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Solicitud inválida" };
  const { id } = parsed.data;

  try {
    const slide = await prisma.tvSlide.findUnique({ where: { id }, select: { active: true } });
    if (!slide) return { ok: false, error: "La diapositiva ya no existe" };

    await prisma.tvSlide.update({ where: { id }, data: { active: !slide.active } });

    refresh();
    return {
      ok: true,
      message: slide.active ? "Diapositiva en pausa" : "Diapositiva activada",
    };
  } catch (e) {
    return dbError(e);
  }
}

export async function moveSlideAction(input: unknown): Promise<ActionResult> {
  await requireSection("tv");

  const parsed = moveSlideSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Solicitud inválida" };
  const { id, direction } = parsed.data;

  try {
    const slide = await prisma.tvSlide.findUnique({ where: { id }, select: { screenId: true } });
    if (!slide) return { ok: false, error: "La diapositiva ya no existe" };

    const list = await prisma.tvSlide.findMany({
      where: { screenId: slide.screenId },
      orderBy: [{ position: "asc" }, { id: "asc" }],
      select: { id: true },
    });

    const from = list.findIndex((s) => s.id === id);
    const to = direction === "up" ? from - 1 : from + 1;
    if (to < 0 || to >= list.length) {
      return { ok: false, error: "La diapositiva ya está en esa posición" };
    }

    [list[from], list[to]] = [list[to], list[from]];
    await prisma.$transaction(
      list.map((s, index) =>
        prisma.tvSlide.update({ where: { id: s.id }, data: { position: index } })
      )
    );
  } catch (e) {
    return dbError(e);
  }

  refresh();
  return { ok: true, message: "Orden actualizado" };
}

export async function deleteSlideAction(input: unknown): Promise<ActionResult> {
  await requireSection("tv");

  const parsed = slideIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Solicitud inválida" };
  const { id } = parsed.data;

  try {
    const slide = await prisma.tvSlide.findUnique({
      where: { id },
      select: { images: { select: { imageId: true } } },
    });
    await prisma.tvSlide.delete({ where: { id } });

    // Las imágenes de una galería eliminada se borran de la base y del disco
    for (const { imageId } of slide?.images ?? []) {
      await deleteImageById(imageId).catch((e) => console.error(e));
    }
  } catch (e) {
    return dbError(e);
  }

  refresh();
  return { ok: true, message: "Diapositiva eliminada" };
}