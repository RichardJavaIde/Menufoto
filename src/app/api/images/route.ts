//src/app/api/images/route.ts
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  ImageError,
  MAX_UPLOAD_BYTES,
  cleanupOrphanImages,
  processUpload,
  removeFiles,
} from "@/lib/images";
import { cropSchema } from "@/lib/schemas/image";
import { toImageInfo } from "@/lib/media";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Tu sesión expiró. Inicia sesión de nuevo." }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "Selecciona una imagen" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return Response.json({ error: "La imagen supera el máximo de 8 MB" }, { status: 413 });
  }

  let crop;
  try {
    const parsed = cropSchema.safeParse(JSON.parse(String(form.get("crop"))));
    if (!parsed.success) throw new Error("crop");
    crop = parsed.data;
  } catch {
    return Response.json({ error: "El recorte es inválido" }, { status: 400 });
  }

  let processed;
  try {
    processed = await processUpload(Buffer.from(await file.arrayBuffer()), crop);
  } catch (e) {
    if (e instanceof ImageError) return Response.json({ error: e.message }, { status: 422 });
    console.error(e);
    return Response.json({ error: "No se pudo procesar la imagen" }, { status: 500 });
  }

  try {
    const image = await prisma.image.create({
      data: {
        fileKey: processed.key,
        width: processed.width,
        height: processed.height,
        sizeBytes: processed.sizeBytes,
        cropX: crop.x,
        cropY: crop.y,
        cropWidth: crop.width,
        cropHeight: crop.height,
      },
    });

    await cleanupOrphanImages().catch(() => null);
    return Response.json(toImageInfo(image));
  } catch (e) {
    console.error(e);
    await removeFiles(processed.key);
    return Response.json({ error: "No se pudo guardar la imagen" }, { status: 500 });
  }
}