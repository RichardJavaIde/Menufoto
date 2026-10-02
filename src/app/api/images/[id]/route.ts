//src\app\api\images\[id]\route.ts
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ImageError, recropImage } from "@/lib/images";
import { cropSchema } from "@/lib/schemas/image";
import { toImageInfo } from "@/lib/media";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Tu sesión expiró. Inicia sesión de nuevo." }, { status: 401 });

  const { id } = await params;

  const parsed = cropSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "El recorte es inválido" }, { status: 400 });
  const crop = parsed.data;

  const image = await prisma.image.findUnique({ where: { id } });
  if (!image) return Response.json({ error: "La imagen ya no existe" }, { status: 404 });

  try {
    const fileKey = await recropImage(image.fileKey, image.width, image.height, crop);
    const updated = await prisma.image.update({
      where: { id },
      data: {
        fileKey,
        cropX: crop.x,
        cropY: crop.y,
        cropWidth: crop.width,
        cropHeight: crop.height,
      },
    });

    revalidatePath("/admin", "layout");
    revalidatePath("/");
    return Response.json(toImageInfo(updated));
  } catch (e) {
    if (e instanceof ImageError) return Response.json({ error: e.message }, { status: 422 });
    console.error(e);
    return Response.json({ error: "No se pudo actualizar el recorte" }, { status: 500 });
  }
}