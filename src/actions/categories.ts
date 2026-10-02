//src/actions/categories.ts
"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSection } from "@/lib/auth";
import type { ActionResult } from "@/lib/action-result";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
  moveCategorySchema,
} from "@/lib/schemas/category";

function dbError(e: unknown): ActionResult {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2025") return { ok: false, error: "La categoría ya no existe" };
    if (e.code === "P2003") {
      return { ok: false, error: "No se puede eliminar: la categoría tiene platos" };
    }
  }
  console.error(e);
  return { ok: false, error: "Ocurrió un error inesperado. Intenta de nuevo." };
}

function refresh() {
  revalidatePath("/admin", "layout");
  revalidatePath("/"); // menú público
}

export async function createCategoryAction(input: unknown): Promise<ActionResult> {
  await requireSection("categorias");

  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { name, description, active } = parsed.data;

  try {
    const last = await prisma.category.aggregate({ _max: { sortOrder: true } });
    const sortOrder = (last._max.sortOrder ?? -1) + 1;

    await prisma.category.create({ data: { name, description, active, sortOrder } });
  } catch (e) {
    return dbError(e);
  }

  refresh();
  return { ok: true, message: "Categoría creada correctamente" };
}

export async function updateCategoryAction(input: unknown): Promise<ActionResult> {
  await requireSection("categorias");

  const parsed = updateCategorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { id, name, description, active } = parsed.data;

  try {
    await prisma.category.update({ where: { id }, data: { name, description, active } });
  } catch (e) {
    return dbError(e);
  }

  refresh();
  return { ok: true, message: "Categoría actualizada correctamente" };
}

export async function toggleCategoryActiveAction(input: unknown): Promise<ActionResult> {
  await requireSection("categorias");

  const parsed = categoryIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Solicitud inválida" };
  const { id } = parsed.data;

  try {
    const category = await prisma.category.findUnique({
      where: { id },
      select: { active: true },
    });
    if (!category) return { ok: false, error: "La categoría ya no existe" };

    await prisma.category.update({ where: { id }, data: { active: !category.active } });

    refresh();
    return {
      ok: true,
      message: category.active ? "Categoría oculta del menú" : "Categoría visible en el menú",
    };
  } catch (e) {
    return dbError(e);
  }
}

export async function moveCategoryAction(input: unknown): Promise<ActionResult> {
  await requireSection("categorias");

  const parsed = moveCategorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Solicitud inválida" };
  const { id, direction } = parsed.data;

  try {
    const list = await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true },
    });

    const from = list.findIndex((c) => c.id === id);
    if (from === -1) return { ok: false, error: "La categoría ya no existe" };

    const to = direction === "up" ? from - 1 : from + 1;
    if (to < 0 || to >= list.length) {
      return { ok: false, error: "La categoría ya está en esa posición" };
    }

    // Intercambia posiciones y renumera todo (también corrige posiciones repetidas)
    [list[from], list[to]] = [list[to], list[from]];
    await prisma.$transaction(
      list.map((c, index) =>
        prisma.category.update({ where: { id: c.id }, data: { sortOrder: index } })
      )
    );
  } catch (e) {
    return dbError(e);
  }

  refresh();
  return { ok: true, message: "Orden actualizado" };
}

export async function deleteCategoryAction(input: unknown): Promise<ActionResult> {
  await requireSection("categorias");

  const parsed = categoryIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Solicitud inválida" };
  const { id } = parsed.data;

  try {
    const dishCount = await prisma.dish.count({ where: { categoryId: id } });
    if (dishCount > 0) {
      return {
        ok: false,
        error: `No se puede eliminar: tiene ${dishCount} ${dishCount === 1 ? "plato" : "platos"}. Muévelos o elimínalos primero.`,
      };
    }

    await prisma.category.delete({ where: { id } });
  } catch (e) {
    return dbError(e);
  }

  refresh();
  return { ok: true, message: "Categoría eliminada" };
}