//src/actions/users.ts
"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSection } from "@/lib/auth";
import type { ActionResult } from "@/lib/action-result";
import {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  userIdSchema,
} from "@/lib/schemas/user";

function dbError(e: unknown): ActionResult {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") return { ok: false, error: "Ya existe un usuario con ese correo" };
    if (e.code === "P2025") return { ok: false, error: "El usuario ya no existe" };
  }
  console.error(e);
  return { ok: false, error: "Ocurrió un error inesperado. Intenta de nuevo." };
}

function refresh() {
  // Refresca todo el panel (lista, nombre en el menú lateral, estadísticas)
  revalidatePath("/admin", "layout");
}

export async function createUserAction(input: unknown): Promise<ActionResult> {
  await requireSection("usuarios");

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { name, email, password, role } = parsed.data;

  try {
    const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (exists) return { ok: false, error: "Ya existe un usuario con ese correo" };

    await prisma.user.create({
      data: { name, email, role, passwordHash: await hash(password, 12) },
    });
  } catch (e) {
    return dbError(e);
  }

  refresh();
  return { ok: true, message: "Usuario creado correctamente" };
}

export async function updateUserAction(input: unknown): Promise<ActionResult> {
  const actor = await requireSection("usuarios");

  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { id, name, email, role } = parsed.data;

  if (id === actor.id && role !== actor.role) {
    return { ok: false, error: "No puedes cambiar tu propio rol" };
  }

  try {
    const taken = await prisma.user.findFirst({
      where: { email, NOT: { id } },
      select: { id: true },
    });
    if (taken) return { ok: false, error: "Ya existe otro usuario con ese correo" };

    await prisma.user.update({ where: { id }, data: { name, email, role } });
  } catch (e) {
    return dbError(e);
  }

  refresh();
  return { ok: true, message: "Usuario actualizado correctamente" };
}

export async function changePasswordAction(input: unknown): Promise<ActionResult> {
  await requireSection("usuarios");

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { id, password } = parsed.data;

  try {
    await prisma.user.update({
      where: { id },
      data: { passwordHash: await hash(password, 12) },
    });
  } catch (e) {
    return dbError(e);
  }

  refresh();
  return { ok: true, message: "Contraseña actualizada correctamente" };
}

export async function toggleUserActiveAction(input: unknown): Promise<ActionResult> {
  const actor = await requireSection("usuarios");

  const parsed = userIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Solicitud inválida" };
  const { id } = parsed.data;

  if (id === actor.id) {
    return { ok: false, error: "No puedes desactivar tu propia cuenta" };
  }

  try {
    const user = await prisma.user.findUnique({ where: { id }, select: { active: true } });
    if (!user) return { ok: false, error: "El usuario ya no existe" };

    await prisma.user.update({ where: { id }, data: { active: !user.active } });

    refresh();
    return {
      ok: true,
      message: user.active ? "Usuario desactivado" : "Usuario activado",
    };
  } catch (e) {
    return dbError(e);
  }
}

export async function deleteUserAction(input: unknown): Promise<ActionResult> {
  const actor = await requireSection("usuarios");

  const parsed = userIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Solicitud inválida" };
  const { id } = parsed.data;

  if (id === actor.id) {
    return { ok: false, error: "No puedes eliminar tu propia cuenta" };
  }

  try {
    await prisma.user.delete({ where: { id } });
  } catch (e) {
    return dbError(e);
  }

  refresh();
  return { ok: true, message: "Usuario eliminado" };
}