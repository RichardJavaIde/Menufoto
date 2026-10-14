//src/actions/tv-slides.ts
"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSection } from "@/lib/auth";
import type { ActionResult } from "@/lib/action-result";
import {
  createSlideSchema,
  updateSlideSchema,
  slideIdSchema,
  moveSlideSchema,
} from "@/lib/schemas/tv-slide";

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
        seconds: type === "CATEGORY" ? 15 : 12,
        categoryId: type === "CATEGORY" ? categoryId : null,
      },
    });
  } catch (e) {
    return dbError(e);
  }

  refresh();
  return { ok: true, message: "Diapositiva agregada" };
}

export async function updateSlideAction(input: unknown): Promise<ActionResult> {
  await requireSection("tv");

  const parsed = updateSlideSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { id, seconds, effect, active, days, start, end, categoryId } = parsed.data;

  try {
    const slide = await prisma.tvSlide.findUnique({ where: { id }, select: { type: true } });
    if (!slide) return { ok: false, error: "La diapositiva ya no existe" };

    await prisma.tvSlide.update({
      where: { id },
      data: {
        seconds,
        effect,
        active,
        days: daysToMask(days),
        startMinute: start ? timeToMinutes(start) : null,
        endMinute: end ? timeToMinutes(end) : null,
        ...(slide.type === "CATEGORY" && categoryId ? { categoryId } : {}),
      },
    });
  } catch (e) {
    return dbError(e);
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
    await prisma.tvSlide.delete({ where: { id } });
  } catch (e) {
    return dbError(e);
  }

  refresh();
  return { ok: true, message: "Diapositiva eliminada" };
}