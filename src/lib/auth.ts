//src/lib/auth.ts
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { readSession } from "@/lib/session";
import { canAccess, type Section } from "@/lib/permissions";

// Lee el usuario real de la base de datos en cada petición
export const getCurrentUser = cache(async () => {
  const session = await readSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true, active: true },
  });

  if (!user || !user.active) return null;
  return user;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireSection(section: Section) {
  const user = await requireUser();
  if (!canAccess(user.role, section)) redirect("/admin?denegado=1");
  return user;
}