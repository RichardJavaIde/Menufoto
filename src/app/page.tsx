//src/app/page.tsx
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [users, tags, categories] = await Promise.all([
    prisma.user.count(),
    prisma.tag.count(),
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { dishes: { orderBy: { sortOrder: "asc" } } },
    }),
  ]);

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-semibold">Menú Digital Visual</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Usuarios: {users} · Etiquetas: {tags} · Categorías: {categories.length}
      </p>
      {categories.map((c) => (
        <section key={c.id} className="mt-6">
          <h2 className="text-lg font-medium">{c.name}</h2>
          <ul className="mt-2 space-y-1">
            {c.dishes.map((d) => (
              <li key={d.id} className="flex justify-between">
                <span>
                  {d.name}
                  {!d.available && " (agotado)"}
                </span>
                <span>{formatPrice(d.priceCents)}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}