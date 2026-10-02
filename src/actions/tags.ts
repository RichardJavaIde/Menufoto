//src/actions/tags.ts
"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSection } from "@/lib/auth";
import type { ActionResult } from "@/lib/action-result";
import {
  createTagSchema,
  updateTagSchema,
  tagIdSchema,
  moveTagSchema,
} from "@/lib/schemas/tag";

function dbError(e: unknown): ActionResult {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") return { ok: false, error: "Ya existe una etiqueta con ese nombre" };
    if (e.code === "P2025") return { ok: false, error: "La etiqueta ya no existe" };
  }
  console.error(e);
  return { ok: false, error: "Ocurrió un error inesperado. Intenta de nuevo." };
}

function refresh() {
  revalidatePath("/admin", "layout");
  revalidatePath("/"); // menú público
}

export async function createTagAction(input: unknown): Promise<ActionResult> {
  await requireSection("etiquetas");

  const parsed = createTagSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { name, icon } = parsed.data;

  try {
    const last = await prisma.tag.aggregate({ _max: { sortOrder: true } });
    const sortOrder = (last._max.sortOrder ?? -1) + 1;

    await prisma.tag.create({ data: { name, icon, sortOrder } });
  } catch (e) {
    return dbError(e);
  }

  refresh();
  return { ok: true, message: "Etiqueta creada correctamente" };
}

export async function updateTagAction(input: unknown): Promise<ActionResult> {
  await requireSection("etiquetas");

  const parsed = updateTagSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { id, name, icon } = parsed.data;

  try {
    await prisma.tag.update({ where: { id }, data: { name, icon } });
  } catch (e) {
    return dbError(e);
  }

  refresh();
  return { ok: true, message: "Etiqueta actualizada correctamente" };
}

export async function moveTagAction(input: unknown): Promise<ActionResult> {
  await requireSection("etiquetas");

  const parsed = moveTagSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Solicitud inválida" };
  const { id, direction } = parsed.data;

  try {
    const list = await prisma.tag.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true },
    });

    const from = list.findIndex((t) => t.id === id);
    if (from === -1) return { ok: false, error: "La etiqueta ya no existe" };

    const to = direction === "up" ? from - 1 : from + 1;
    if (to < 0 || to >= list.length) {
      return { ok: false, error: "La etiqueta ya está en esa posición" };
    }

    // Intercambia posiciones y renumera todo
    [list[from], list[to]] = [list[to], list[from]];
    await prisma.$transaction(
      list.map((t, index) =>
        prisma.tag.update({ where: { id: t.id }, data: { sortOrder: index } })
      )
    );
  } catch (e) {
    return dbError(e);
  }

  refresh();
  return { ok: true, message: "Orden actualizado" };
}

export async function deleteTagAction(input: unknown): Promise<ActionResult> {
  await requireSection("etiquetas");

  const parsed = tagIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Solicitud inválida" };
  const { id } = parsed.data;

  try {
    // Los platos no se borran: solo se les quita la etiqueta
    await prisma.tag.delete({ where: { id } });
  } catch (e) {
    return dbError(e);
  }

  refresh();
  return { ok: true, message: "Etiqueta eliminada" };
}