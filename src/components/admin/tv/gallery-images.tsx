//src/components/admin/tv/gallery-images.tsx
"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { secondaryButton } from "@/components/ui/styles";
import { mediaUrl, type ImageInfo } from "@/lib/media";
import { isSupportedImage, prepareImage } from "@/lib/client-image";
import type { GalleryImage } from "./slide-meta";

// Incluye HEIC/HEIF, el formato de las fotos de iPhone y iPad
const ACCEPT_ATTR = "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";
const MAX_BYTES = 8 * 1024 * 1024;
// Los flyers se suben completos, sin recortar
const FULL_CROP = JSON.stringify({ x: 0, y: 0, width: 100, height: 100 });

const iconButton =
  "rounded-md p-2 text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40";

export function GalleryImages({
  images,
  onChange,
  max,
}: {
  images: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
  max: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const room = max - images.length;
    if (room <= 0) {
      toast.error(`Este modo admite como máximo ${max} ${max === 1 ? "imagen" : "imágenes"}`);
      return;
    }

    setBusy(true);
    const added: GalleryImage[] = [];
    try {
      for (const file of files.slice(0, room)) {
        if (!isSupportedImage(file)) {
          toast.error(`${file.name}: formato no permitido. Usa JPG, PNG, WebP o HEIC`);
          continue;
        }
        try {
          const ready = await prepareImage(file);
          if (ready.size > MAX_BYTES) {
            toast.error(`${file.name}: la imagen sigue siendo demasiado pesada`);
            continue;
          }
          const form = new FormData();
          form.append("file", ready);
          form.append("crop", FULL_CROP);

          const res = await fetch("/api/images", { method: "POST", body: form });
          const data = await res.json().catch(() => null);
          if (!res.ok) {
            toast.error(data?.error ?? "No se pudo subir la imagen");
            continue;
          }
          const info = data as ImageInfo;
          added.push({ id: info.id, key: info.key });
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "No se pudo leer la imagen");
        }
      }
      if (files.length > room) {
        toast.message(`Solo cabían ${room}; se subieron las primeras.`);
      }
    } finally {
      setBusy(false);
    }

    if (added.length > 0) onChange([...images, ...added]);
  }

  function move(index: number, direction: -1 | 1) {
    const next = [...images];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function remove(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          Imágenes{" "}
          <span className="font-normal text-neutral-500">
            ({images.length}/{max})
          </span>
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy || images.length >= max}
          className={secondaryButton}
        >
          {busy ? <Spinner className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />}
          {busy ? "Subiendo…" : "Subir imagen"}
        </button>
      </div>

      {images.length === 0 ? (
        <p className="mt-2 rounded-lg border border-dashed border-neutral-300 p-4 text-center text-sm text-neutral-500">
          Aún no hay imágenes. Sube tu flyer en formato horizontal (16:9).
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {images.map((img, index) => (
            <li
              key={img.id}
              className="flex items-center gap-3 rounded-lg p-2 ring-1 ring-neutral-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl(img.key, 480)}
                alt={`Imagen ${index + 1}`}
                className="h-16 w-28 shrink-0 rounded bg-neutral-100 object-contain"
              />
              <span className="flex-1 text-sm text-neutral-600">Imagen {index + 1}</span>
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={busy || index === 0}
                className={iconButton}
                title="Subir"
                aria-label="Subir"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={busy || index === images.length - 1}
                className={iconButton}
                title="Bajar"
                aria-label="Bajar"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => remove(index)}
                disabled={busy}
                className={`${iconButton} hover:text-red-600`}
                title="Quitar"
                aria-label="Quitar"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-2 text-xs text-neutral-500">
        JPG, PNG, WebP o HEIC · mínimo 400 px por lado. Se muestran completas, sin recortar.
        Recomendado: 1920×1080.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        multiple
        onChange={onPick}
        className="hidden"
      />
    </div>
  );
}