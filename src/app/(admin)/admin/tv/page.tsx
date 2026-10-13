//src/app/(admin)/admin/tv/page.tsx
import { prisma } from "@/lib/prisma";
import { requireSection } from "@/lib/auth";
import { siteUrl } from "@/lib/site";
import { TvManager } from "@/components/admin/tv/tv-manager";

export default async function TvPage() {
  await requireSection("tv");

  const [screens, settings] = await Promise.all([
    prisma.tvScreen.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { slides: true } } },
    }),
    prisma.restaurantSettings.findUnique({
      where: { id: 1 },
      select: { timezone: true },
    }),
  ]);

  const tz = settings?.timezone ?? "America/Santo_Domingo";
  const base = siteUrl();
  const fmt = new Intl.DateTimeFormat("es-DO", {
    timeZone: tz,
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <TvManager
      screens={screens.map((s) => ({
        id: s.id,
        name: s.name,
        url: `${base}/tv/${s.token}`,
        active: s.active,
        slideCount: s._count.slides,
        lastSeen: s.lastSeenAt ? fmt.format(s.lastSeenAt) : null,
      }))}
    />
  );
}