//src/app/(admin)/admin/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { NAV_ITEMS } from "@/components/admin/nav-items";
import { DeniedToast } from "@/components/admin/denied-toast";

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ denegado?: string }>;
}) {
  const user = await requireUser();
  const { denegado } = await searchParams;

  const [categories, dishes, tags, unavailable, withoutPhoto] = await Promise.all([
    prisma.category.count(),
    prisma.dish.count(),
    prisma.tag.count(),
    prisma.dish.count({ where: { available: false } }),
    prisma.dish.count({ where: { imageId: null } }),
  ]);

  const stats = [
    { label: "Categorías", value: categories },
    { label: "Platos", value: dishes },
    { label: "Etiquetas", value: tags },
    { label: "Agotados", value: unavailable },
    { label: "Sin fotografía", value: withoutPhoto },
  ];

  const shortcuts = NAV_ITEMS.filter(
    (item) => item.section !== "dashboard" && canAccess(user.role, item.section)
  );

  return (
    <div className="mx-auto max-w-5xl">
      <DeniedToast show={denegado === "1"} />

      <h1 className="text-2xl font-semibold">Hola, {user.name}</h1>
      <p className="mt-1 text-sm text-neutral-500">Resumen de tu carta digital</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-white p-4 ring-1 ring-neutral-200">
            <p className="text-2xl font-semibold">{s.value}</p>
            <p className="text-xs text-neutral-500">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-3 mt-10 text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Accesos rápidos
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shortcuts.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-xl bg-white p-4 ring-1 ring-neutral-200 transition hover:ring-neutral-400"
          >
            <Icon className="h-5 w-5 text-neutral-700" />
            <span className="font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}