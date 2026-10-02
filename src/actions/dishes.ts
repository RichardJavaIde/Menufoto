//src/actions/dishes.ts
"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSection } from "@/lib/auth";
import { deleteImageById } from "@/lib/images";
import type { ActionResult } from "@/lib/action-result";
import {
  createDishSchema,
  updateDishSchema,
  dishIdSchema,
  toggleDishFlagSchema,
  moveDishSchema,
} from "@/lib/schemas/dish";

const IMAGE_UNAVAILABLE = "La foto ya no está disponible. Súbela de nuevo.";

function dbError(e: unknown): ActionResult {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2025") {
      return { ok: false, error: "El plato, la categoría o una etiqueta ya no existe" };
    }
    if (e.code === "P2003") {
      return { ok: false, error: "La categoría seleccionada ya no existe" };
    }
  }
  console.error(e);
  return { ok: false, error: "Ocurrió un error inesperado. Intenta de nuevo." };
}

function refresh() {
  revalidatePath("/admin", "layout");
  revalidatePath("/"); // menú público
}

async function nextSortOrder(categoryId: string) {
  const last = await prisma.dish.aggregate({
    where: { categoryId },
    _max: { sortOrder: true },
  });
  return (last._max.sortOrder ?? -1) + 1;
}

// Una foto solo se puede asignar si existe y no está en uso por otro plato, el logo o la portada
async function imageIsFree(imageId: string) {
  const found = await prisma.image.findFirst({
    where: {
      id: imageId,
      dishes: { none: {} },
      logoOf: { none: {} },
      coverOf: { none: {} },
    },
    select: { id: true },
  });
  return found !== null;
}

export async function createDishAction(input: unknown): Promise<ActionResult> {
  await requireSection("platos");

  const parsed = createDishSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { name, description, price, categoryId, tagIds, imageId, visible, available } =
    parsed.data;

  try {
    if (imageId && !(await imageIsFree(imageId))) {
      return { ok: false, error: IMAGE_UNAVAILABLE };
    }

    await prisma.dish.create({
      data: {
        name,
        description,
        priceCents: price,
        categoryId,
        imageId,
        visible,
        available,
        sortOrder: await nextSortOrder(categoryId),
        tags: { connect: tagIds.map((id) => ({ id })) },
      },
    });
  } catch (e) {
    return dbError(e);
  }

  refresh();
  return { ok: true, message: "Plato creado correctamente" };
}

export async function updateDishAction(input: unknown): Promise<ActionResult> {
  await requireSection("platos");

  const parsed = updateDishSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { id, name, description, price, categoryId, tagIds, imageId, visible, available } =
    parsed.data;

  let previousImageId: string | null = null;

  try {
    const current = await prisma.dish.findUnique({
      where: { id },
      select: { categoryId: true, imageId: true },
    });
    if (!current) return { ok: false, error: "El plato ya no existe" };
    previousImageId = current.imageId;

    if (imageId && imageId !== current.imageId && !(await imageIsFree(imageId))) {
      return { ok: false, error: IMAGE_UNAVAILABLE };
    }

    // Si cambia de categoría, pasa al final de la nueva (undefined = no se modifica)
    const sortOrder =
      current.categoryId !== categoryId ? await nextSortOrder(categoryId) : undefined;

    await prisma.dish.update({
      where: { id },
      data: {
        name,
        description,
        priceCents: price,
        categoryId,
        imageId,
        visible,
        available,
        sortOrder,
        tags: { set: tagIds.map((tagId) => ({ id: tagId })) },
      },
    });
  } catch (e) {
    return dbError(e);
  }

  // Si la foto cambió o se quitó, la anterior se borra de la base y del disco
  if (previousImageId && previousImageId !== imageId) {
    await deleteImageById(previousImageId).catch((e) => console.error(e));
  }

  refresh();
  return { ok: true, message: "Plato actualizado correctamente" };
}

export async function toggleDishFlagAction(input: unknown): Promise<ActionResult> {
  await requireSection("platos");

  const parsed = toggleDishFlagSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Solicitud inválida" };
  const { id, field } = parsed.data;

  try {
    const dish = await prisma.dish.findUnique({
      where: { id },
      select: { visible: true, available: true },
    });
    if (!dish) return { ok: false, error: "El plato ya no existe" };

    const next = !dish[field];
    await prisma.dish.update({
      where: { id },
      data: field === "visible" ? { visible: next } : { available: next },
    });

    refresh();

    if (field === "visible") {
      return { ok: true, message: next ? "Plato visible en el menú" : "Plato oculto del menú" };
    }
    return {
      ok: true,
      message: next ? "Plato marcado como disponible" : "Plato marcado como agotado",
    };
  } catch (e) {
    return dbError(e);
  }
}

export async function moveDishAction(input: unknown): Promise<ActionResult> {
  await requireSection("platos");

  const parsed = moveDishSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Solicitud inválida" };
  const { id, direction } = parsed.data;

  try {
    const dish = await prisma.dish.findUnique({ where: { id }, select: { categoryId: true } });
    if (!dish) return { ok: false, error: "El plato ya no existe" };

    // Solo se ordena entre los platos de la misma categoría
    const list = await prisma.dish.findMany({
      where: { categoryId: dish.categoryId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true },
    });

    const from = list.findIndex((d) => d.id === id);
    const to = direction === "up" ? from - 1 : from + 1;
    if (to < 0 || to >= list.length) {
      return { ok: false, error: "El plato ya está en esa posición" };
    }

    [list[from], list[to]] = [list[to], list[from]];
    await prisma.$transaction(
      list.map((d, index) =>
        prisma.dish.update({ where: { id: d.id }, data: { sortOrder: index } })
      )
    );
  } catch (e) {
    return dbError(e);
  }

  refresh();
  return { ok: true, message: "Orden actualizado" };
}

export async function deleteDishAction(input: unknown): Promise<ActionResult> {
  await requireSection("platos");

  const parsed = dishIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Solicitud inválida" };
  const { id } = parsed.data;

  try {
    const dish = await prisma.dish.findUnique({ where: { id }, select: { imageId: true } });
    await prisma.dish.delete({ where: { id } });

    if (dish?.imageId) {
      await deleteImageById(dish.imageId).catch((e) => console.error(e));
    }
  } catch (e) {
    return dbError(e);
  }

  refresh();
  return { ok: true, message: "Plato eliminado" };
}