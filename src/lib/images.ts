//src/lib/media.ts
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { mediaUrl } from "@/lib/media";
import type { Crop } from "@/lib/schemas/image";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB
export const VARIANT_WIDTHS = [480, 960] as const;

const SOURCE_MAX = 2000; // lado máximo de la copia base
const MIN_SIDE = 400; // lado corto mínimo
const MAX_SIDE = 8000; // lado largo máximo
const MAX_PIXELS = 64_000_000;
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp"]);

export class ImageError extends Error {}

type ImageMetadata = Awaited<ReturnType<ReturnType<typeof sharp>["metadata"]>>;

function newKey() {
  return randomBytes(12).toString("hex"); // 24 caracteres hexadecimales
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

function cropToPixels(crop: Crop, w: number, h: number) {
  const left = clamp(Math.round((crop.x / 100) * w), 0, w - 1);
  const top = clamp(Math.round((crop.y / 100) * h), 0, h - 1);
  const width = clamp(Math.round((crop.width / 100) * w), 1, w - left);
  const height = clamp(Math.round((crop.height / 100) * h), 1, h - top);
  return { left, top, width, height };
}

// Guarda un archivo en Vercel Blob con cache de un año (la clave cambia si la foto cambia)
async function putFile(name: string, data: Buffer) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new ImageError("Falta configurar BLOB_READ_WRITE_TOKEN para subir fotos");
  }
  await put(`media/${name}`, data, {
    access: "public",
    addRandomSuffix: false,
    contentType: "image/webp",
    cacheControlMaxAge: 60 * 60 * 24 * 365,
  });
}

async function writeVariants(key: string, source: Buffer, w: number, h: number, crop: Crop) {
  const region = cropToPixels(crop, w, h);
  await Promise.all(
    VARIANT_WIDTHS.map(async (width) => {
      const out = await sharp(source)
        .extract(region)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 78 })
        .toBuffer();
      await putFile(`${key}-${width}.webp`, out);
    })
  );
}

export async function removeFiles(key: string) {
  const urls = [mediaUrl(key, "src"), ...VARIANT_WIDTHS.map((w) => mediaUrl(key, w))];
  await del(urls).catch((e) => console.error("No se pudieron borrar archivos de Blob", e));
}

export async function processUpload(buffer: Buffer, crop: Crop) {
  let meta: ImageMetadata;
  try {
    meta = await sharp(buffer, { limitInputPixels: MAX_PIXELS }).metadata();
  } catch {
    throw new ImageError("El archivo no es una imagen válida");
  }

  if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) {
    throw new ImageError("Formato no permitido. Usa JPG, PNG o WebP");
  }

  // Si la foto viene rotada por EXIF, el ancho y el alto se intercambian
  const rotated = (meta.orientation ?? 1) >= 5;
  const w = (rotated ? meta.height : meta.width) ?? 0;
  const h = (rotated ? meta.width : meta.height) ?? 0;

  if (Math.min(w, h) < MIN_SIDE) {
    throw new ImageError(`La imagen es muy pequeña: el lado menor debe tener al menos ${MIN_SIDE} px`);
  }
  if (Math.max(w, h) > MAX_SIDE) {
    throw new ImageError(`La imagen es demasiado grande: máximo ${MAX_SIDE} px por lado`);
  }

  // Copia base: orientada, reducida y en WebP (sin recortar)
  const { data, info } = await sharp(buffer, { limitInputPixels: MAX_PIXELS })
    .rotate()
    .resize({ width: SOURCE_MAX, height: SOURCE_MAX, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer({ resolveWithObject: true });

  const key = newKey();

  try {
    await putFile(`${key}-src.webp`, data);
    await writeVariants(key, data, info.width, info.height, crop);
  } catch (e) {
    await removeFiles(key);
    throw e;
  }

  return { key, width: info.width, height: info.height, sizeBytes: data.length };
}

// Genera un recorte nuevo con una clave nueva, para que la URL cambie y el cache no sirva la foto vieja
export async function recropImage(oldKey: string, width: number, height: number, crop: Crop) {
  let source: Buffer;
  try {
    const res = await fetch(mediaUrl(oldKey, "src"), { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    source = Buffer.from(await res.arrayBuffer());
  } catch {
    throw new ImageError("No se encontró el archivo de la imagen. Súbela de nuevo.");
  }

  const key = newKey();
  try {
    await putFile(`${key}-src.webp`, source);
    await writeVariants(key, source, width, height, crop);
  } catch (e) {
    await removeFiles(key);
    throw e;
  }

  await removeFiles(oldKey);
  return key;
}

export async function deleteImageById(id: string) {
  const image = await prisma.image.findUnique({ where: { id }, select: { fileKey: true } });
  if (!image) return;
  await prisma.image.delete({ where: { id } }).catch(() => null);
  await removeFiles(image.fileKey);
}

// Borra fotos subidas que nunca se asignaron a nada (formulario cancelado)
export async function cleanupOrphanImages() {
  const orphans = await prisma.image.findMany({
    where: {
      createdAt: { lt: new Date(Date.now() - 60 * 60 * 1000) },
      dishes: { none: {} },
      logoOf: { none: {} },
      coverOf: { none: {} },
    },
    select: { id: true },
  });
  for (const o of orphans) await deleteImageById(o.id);
}

// Una foto se puede asignar solo si existe y no la usa ningún plato, el logo ni la portada
export async function isImageFree(id: string) {
  const found = await prisma.image.findFirst({
    where: { id, dishes: { none: {} }, logoOf: { none: {} }, coverOf: { none: {} } },
    select: { id: true },
  });
  return found !== null;
}