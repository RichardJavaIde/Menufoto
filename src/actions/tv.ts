//src/actions/tv.ts
"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSection } from "@/lib/auth";
import type { ActionResult } from "@/lib/action-result";
import {
  createScreenSchema,
  updateScreenSchema,
  screenIdSchema,
} from "@/lib/schemas/tv";

function dbError(e: unknown): ActionResult {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") {
      return { ok: false, error: "Ya existe una pantalla con ese enlace. Elige otro." };
    }
    if (e.code === "P2025") return { ok: false, error: "La pantalla ya no existe" };
  }
  console.error(e);
  return { ok: false, error: "Ocurrió un error inesperado. Intenta de nuevo." };
}

function refresh() {
  revalidatePath("/admin", "layout");
}

// Primer número libre: "1", "2", "3"…
async function nextFreeLink() {
  const used = new Set(
    (await prisma.tvScreen.findMany({ select: { token: true } })).map((s) => s.token)
  );
  let n = 1;
  while (used.has(String(n))) n++;
  return String(n);
}

export async function createScreenAction(input: unknown): Promise<ActionResult> {
  await requireSection("tv");

  const parsed = createScreenSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { name, link, preset } = parsed.data;

  try {
    let slides: Prisma.TvSlideCreateWithoutScreenInput[] = [];

    if (preset === "PROMO") {
      slides = [
        { type: "OFFERS", position: 0, seconds: 12 },
        { type: "POPULAR", position: 1, seconds: 12 },
      ];
    } else if (preset === "MENU") {
      const categories = await prisma.category.findMany({
        where: { active: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true },
      });
      slides = categories.map((c, index) => ({
        type: "CATEGORY" as const,
        position: index,
        seconds: 15,
        category: { connect: { id: c.id } },
      }));
    }

    await prisma.tvScreen.create({
      data: {
        name,
        token: link || (await nextFreeLink()),
        slides: { create: slides },
      },
    });
  } catch (e) {
    return dbError(e);
  }

  refresh();
  return { ok: true, message: "Pantalla creada correctamente" };
}

export async function updateScreenAction(input: unknown): Promise<ActionResult> {
  await requireSection("tv");

  const parsed = updateScreenSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { id, name, link } = parsed.data;

  try {
    await prisma.tvScreen.update({ where: { id }, data: { name, token: link } });
  } catch (e) {
    return dbError(e);
  }

  refresh();
  return { ok: true, message: "Pantalla actualizada" };
}

export async function toggleScreenActiveAction(input: unknown): Promise<ActionResult> {
  await requireSection("tv");

  const parsed = screenIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Solicitud inválida" };
  const { id } = parsed.data;

  try {
    const screen = await prisma.tvScreen.findUnique({
      where: { id },
      select: { active: true },
    });
    if (!screen) return { ok: false, error: "La pantalla ya no existe" };

    await prisma.tvScreen.update({ where: { id }, data: { active: !screen.active } });

    refresh();
    return {
      ok: true,
      message: screen.active ? "Pantalla desactivada" : "Pantalla activada",
    };
  } catch (e) {
    return dbError(e);
  }
}

export async function deleteScreenAction(input: unknown): Promise<ActionResult> {
  await requireSection("tv");

  const parsed = screenIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Solicitud inválida" };
  const { id } = parsed.data;

  try {
    await prisma.tvScreen.delete({ where: { id } });
  } catch (e) {
    return dbError(e);
  }

  refresh();
  return { ok: true, message: "Pantalla eliminada" };
}