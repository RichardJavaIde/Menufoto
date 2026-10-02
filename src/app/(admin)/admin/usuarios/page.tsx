//src/app/(admin)/admin/usuarios/page.tsx
import { prisma } from "@/lib/prisma";
import { requireSection } from "@/lib/auth";
import { UsersManager } from "@/components/admin/users/users-manager";

export default async function UsuariosPage() {
  const current = await requireSection("usuarios");

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true, active: true },
  });

  return <UsersManager users={users} currentUserId={current.id} />;
}