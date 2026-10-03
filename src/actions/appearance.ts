//src/actions/appearance.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSection } from "@/lib/auth";
import type { ActionResult } from "@/lib/action-result";
import { appearanceSchema } from "@/lib/schemas/appearance";

export async function saveAppearanceAction(input: unknown): Promise<ActionResult> {
  await requireSection("apariencia"); // solo ADMIN

  const parsed = appearanceSchema.safeParse(input);
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
    return { ok: false, error: "No se pudo guardar la apariencia. Intenta de nuevo." };
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/"); // menú público
  return { ok: true, message: "Apariencia guardada. Ya se ve en el menú público." };
}