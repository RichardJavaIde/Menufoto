//src/lib/client-image.ts
// Reduce la foto en el navegador antes de enviarla (Vercel limita las peticiones a ~4,5 MB)
// Preparación de fotos en el navegador (se ejecuta en el dispositivo del usuario)

const BASE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const HEIC_TYPE = /^image\/hei[cf]$/i;
const HEIC_EXT = /\.(heic|heif)$/i;

export function isHeic(file: File) {
  return HEIC_TYPE.test(file.type) || HEIC_EXT.test(file.name);
}

export function isSupportedImage(file: File) {
  return BASE_TYPES.includes(file.type) || isHeic(file);
}

// Reduce la foto, respeta la orientación y la guarda en WebP (o JPEG si el navegador no puede)
async function renderResized(source: Blob, maxSide: number): Promise<File> {
  const bitmap = await createImageBitmap(source, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const toBlob = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.9));

  let blob = await toBlob("image/webp");
  // Algunos navegadores no pueden crear WebP y devuelven PNG, que pesa mucho más
  if (!blob || blob.type !== "image/webp") blob = await toBlob("image/jpeg");
  if (!blob) throw new Error("blob");

  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  return new File([blob], `foto.${ext}`, { type: blob.type });
}

/**
 * Deja la foto lista para recortar y subir.
 * - Safari (iPhone, iPad, Mac) lee HEIC de forma nativa.
 * - En otros navegadores, una foto HEIC se convierte con una librería que se carga solo cuando hace falta.
 */
export async function prepareImage(file: File, maxSide = 2000): Promise<File> {
  try {
    return await renderResized(file, maxSide);
  } catch {
    if (!isHeic(file)) {
      throw new Error("No se pudo leer la imagen. Prueba con otra foto.");
    }
  }

  try {
    const { default: heic2any } = await import("heic2any");
    const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    return await renderResized(blob, maxSide);
  } catch {
    throw new Error("No se pudo convertir la foto del iPhone. Prueba con otra foto.");
  }
}