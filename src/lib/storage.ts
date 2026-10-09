//src/lib/storage.ts
import { promises as fs } from "node:fs";
import path from "node:path";
import { put, del } from "@vercel/blob";

export type StorageDriver = "local" | "blob";

// STORAGE_DRIVER manda. Si no está definida: Blob cuando hay token, disco cuando no.
export function storageDriver(): StorageDriver {
  const v = process.env.STORAGE_DRIVER;
  if (v === "local" || v === "blob") return v;
  return process.env.BLOB_READ_WRITE_TOKEN ? "blob" : "local";
}

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads"));

// Solo se aceptan nombres que generamos nosotros (evita rutas como ../../etc)
const SAFE_NAME = /^[a-f0-9]{24}-(src|480|960)\.webp$/;
export const isSafeName = (name: string) => SAFE_NAME.test(name);

export async function saveFile(name: string, data: Buffer) {
  if (!isSafeName(name)) throw new Error("Nombre de archivo no válido");

  if (storageDriver() === "blob") {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("Falta configurar BLOB_READ_WRITE_TOKEN para subir fotos");
    }
    await put(`media/${name}`, data, {
      access: "public",
      addRandomSuffix: false,
      contentType: "image/webp",
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    });
    return;
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, name), data);
}

export async function readLocalFile(name: string) {
  if (!isSafeName(name)) throw new Error("Nombre de archivo no válido");
  return fs.readFile(path.join(UPLOAD_DIR, name));
}

export async function readFile(name: string) {
  if (storageDriver() === "local") return readLocalFile(name);
  const base = process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? "";
  const res = await fetch(`${base}/media/${name}`, { cache: "no-store" });
  if (!res.ok) throw new Error(String(res.status));
  return Buffer.from(await res.arrayBuffer());
}

export async function deleteFiles(names: string[]) {
  const safe = names.filter(isSafeName);
  try {
    if (storageDriver() === "blob") {
      const base = process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? "";
      await del(safe.map((n) => `${base}/media/${n}`));
    } else {
      await Promise.all(safe.map((n) => fs.rm(path.join(UPLOAD_DIR, n), { force: true })));
    }
  } catch (e) {
    console.error("No se pudieron borrar archivos", e);
  }
}