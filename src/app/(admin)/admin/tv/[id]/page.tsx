//src/app/(admin)/admin/tv/[id]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSection } from "@/lib/auth";
import { SlidesManager } from "@/components/admin/tv/slides-manager";

export default async function TvSlidesPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSection("tv");
  const { id } = await params;

  const [screen, categories] = await Promise.all([
    prisma.tvScreen.findUnique({
      where: { id },
      include: {
        slides: {
          orderBy: [{ position: "asc" }, { id: "asc" }],
          include: {
            category: { select: { name: true } },
            images: {
              orderBy: { position: "asc" },
              include: { image: { select: { id: true, fileKey: true } } },
            },
          },
        },
      },
    }),
    prisma.category.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true },
    }),
  ]);

  if (!screen) notFound();

  return (
    <SlidesManager
      screen={{ id: screen.id, name: screen.name, link: screen.token }}
      categories={categories}
      slides={screen.slides.map((s) => ({
        id: s.id,
        type: s.type,
        seconds: s.seconds,
        effect: s.effect,
        active: s.active,
        days: s.days,
        startMinute: s.startMinute,
        endMinute: s.endMinute,
        categoryId: s.categoryId,
        categoryName: s.category?.name ?? null,
        galleryMode: s.galleryMode,
        images: s.images.map((i) => ({ id: i.image.id, key: i.image.fileKey })),
      }))}
    />
  );
}