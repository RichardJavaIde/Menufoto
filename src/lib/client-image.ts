//src/lib/client-image.ts
// Reduce la foto en el navegador antes de enviarla (Vercel limita las peticiones a ~4,5 MB)
export async function shrinkForUpload(file: File, maxSide = 2000): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    const toBlob = (type: string, quality: number) =>
      new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

    let blob = await toBlob("image/webp", 0.9);
    // Algunos navegadores no pueden crear WebP y devuelven PNG, que pesa mucho más
    if (!blob || blob.type !== "image/webp") blob = await toBlob("image/jpeg", 0.9);
    if (!blob) return file;

    const ext = blob.type === "image/webp" ? "webp" : "jpg";
    return new File([blob], `foto.${ext}`, { type: blob.type });
  } catch {
    return file;
  }
}