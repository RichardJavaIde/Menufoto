//src/components/admin/dishes/image-field.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Cropper, { type Area } from "react-easy-crop";
import { toast } from "sonner";
import { ImagePlus, Crop as CropIcon, Trash2, RefreshCw, ImageIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { primaryButton, secondaryButton } from "@/components/ui/styles";
import { cropAspect, mediaUrl, type ImageInfo } from "@/lib/media";
import { isSupportedImage, prepareImage } from "@/lib/client-image";

// Incluye HEIC/HEIF, el formato de las fotos de iPhone y iPad
const ACCEPT_ATTR = "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";
const MAX_BYTES = 8 * 1024 * 1024;

export type AspectOption = { label: string; value: number };

export const DEFAULT_ASPECTS: AspectOption[] = [
  { label: "4:3", value: 4 / 3 },
  { label: "1:1", value: 1 },
  { label: "16:9", value: 16 / 9 },
  { label: "3:4", value: 3 / 4 },
];

const round4 = (v: number) => Math.round(v * 10000) / 10000;

function toCrop(area: Area) {
  return {
    x: Math.min(100, Math.max(0, round4(area.x))),
    y: Math.min(100, Math.max(0, round4(area.y))),
    width: Math.min(100, Math.max(1, round4(area.width))),
    height: Math.min(100, Math.max(1, round4(area.height))),
  };
}

function nearestAspect(aspects: AspectOption[], value: number) {
  return aspects.reduce((best, a) =>
    Math.abs(a.value - value) < Math.abs(best.value - value) ? a : best
  ).value;
}

type EditorState =
  | { mode: "upload"; file: File; src: string }
  | { mode: "recrop"; src: string }
  | null;

function ImageCropper({
  src,
  aspects,
  round,
  initialAspect,
  initialArea,
  busy,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  src: string;
  aspects: AspectOption[];
  round: boolean;
  initialAspect?: number;
  initialArea?: Area;
  busy: boolean;
  confirmLabel: string;
  onConfirm: (area: Area) => void;
  onCancel: () => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(initialAspect ?? aspects[0].value);
  const [area, setArea] = useState<Area | null>(null);

  // Escape cierra solo este editor, no el formulario que está debajo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCancel();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onCancel]);

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl">
        <h3 className="mb-3 text-lg font-semibold">Ajusta la fotografía</h3>

        <div className="relative h-72 w-full overflow-hidden rounded-lg bg-neutral-900">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={round ? "round" : "rect"}
            initialCroppedAreaPercentages={initialArea}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(percent) => setArea(percent)}
          />
        </div>

        {aspects.length > 1 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {aspects.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => setAspect(a.value)}
                aria-pressed={aspect === a.value}
                className={`rounded-md px-3 py-1 text-sm ${
                  aspect === a.value
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-800 hover:bg-neutral-200"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}

        <label className="mt-4 block text-sm font-medium">
          Zoom
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="mt-1 w-full"
          />
        </label>
        <p className="mt-1 text-xs text-neutral-500">
          Arrastra la imagen para moverla. La foto no se deforma: solo se recorta.
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={busy} className={secondaryButton}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => area && onConfirm(area)}
            disabled={busy || !area}
            className={primaryButton}
          >
            {busy && <Spinner className="h-4 w-4" />}
            {busy ? "Procesando…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function ImageField({
  value,
  onChange,
  label = "Fotografía",
  hint = "JPG, PNG, WebP o HEIC (iPhone) · mínimo 400 px por lado.",
  aspects = DEFAULT_ASPECTS,
  round = false,
  previewWidth = "w-40",
  uploadLabel = "Subir foto",
}: {
  value: ImageInfo | null;
  onChange: (value: ImageInfo | null) => void;
  label?: string;
  hint?: string;
  aspects?: AspectOption[];
  round?: boolean;
  previewWidth?: string;
  uploadLabel?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editor, setEditor] = useState<EditorState>(null);
  const [busy, setBusy] = useState(false);
  const [preparing, setPreparing] = useState(false);

  function closeEditor() {
    if (editor?.mode === "upload") URL.revokeObjectURL(editor.src);
    setEditor(null);
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!isSupportedImage(file)) {
      toast.error("Formato no permitido. Usa JPG, PNG, WebP o HEIC");
      return;
    }

    setPreparing(true);
    try {
      // Convierte HEIC (iPhone/iPad) y reduce la foto a 2000 px antes de recortarla
      const ready = await prepareImage(file);
      if (ready.size > MAX_BYTES) {
        toast.error("La imagen sigue siendo demasiado pesada. Prueba con otra foto.");
        return;
      }
      setEditor({ mode: "upload", file: ready, src: URL.createObjectURL(ready) });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo leer la foto");
    } finally {
      setPreparing(false);
    }
  }

  async function confirm(area: Area) {
    if (!editor) return;
    const crop = toCrop(area);
    setBusy(true);

    try {
      let res: Response;
      if (editor.mode === "upload") {
        const form = new FormData();
        form.append("file", editor.file);
        form.append("crop", JSON.stringify(crop));
        res = await fetch("/api/images", { method: "POST", body: form });
      } else {
        res = await fetch(`/api/images/${value!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(crop),
        });
      }

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "No se pudo procesar la imagen");
        return;
      }

      onChange(data as ImageInfo);
      toast.success(
        editor.mode === "upload"
          ? "Foto lista. Guarda los cambios para aplicarla."
          : "Recorte actualizado"
      );
      closeEditor();
    } catch {
      toast.error("Error de conexión. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="block text-sm font-medium">
        {label} <span className="font-normal text-neutral-500">(opcional)</span>
      </p>

      <div className="mt-2 flex items-start gap-4">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl(value.key, 480)}
            alt={label}
            style={{ aspectRatio: round ? 1 : cropAspect(value) }}
            className={`${previewWidth} object-cover ring-1 ring-neutral-200 ${
              round ? "rounded-full" : "rounded-lg"
            }`}
          />
        ) : (
          <div
            className={`flex items-center justify-center border border-dashed border-neutral-300 text-neutral-400 ${previewWidth} ${
              round ? "aspect-square rounded-full" : "h-28 rounded-lg"
            }`}
          >
            <ImageIcon className="h-6 w-6" />
          </div>
        )}

        <div className="flex flex-col items-start gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={preparing}
            className={secondaryButton}
          >
            {preparing ? (
              <Spinner className="h-4 w-4" />
            ) : value ? (
              <RefreshCw className="h-4 w-4" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
            {preparing ? "Preparando…" : value ? "Cambiar" : uploadLabel}
          </button>

          {value && (
            <>
              <button
                type="button"
                onClick={() => setEditor({ mode: "recrop", src: mediaUrl(value.key, "src") })}
                className={secondaryButton}
              >
                <CropIcon className="h-4 w-4" />
                Ajustar recorte
              </button>
              <button
                type="button"
                onClick={() => onChange(null)}
                className="inline-flex items-center gap-2 px-1 text-sm text-red-600 hover:underline"
              >
                <Trash2 className="h-4 w-4" />
                Quitar
              </button>
            </>
          )}
        </div>
      </div>

      <p className="mt-2 text-xs text-neutral-500">{hint}</p>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        onChange={onPick}
        className="hidden"
      />

      {editor && (
        <ImageCropper
          src={editor.src}
          aspects={aspects}
          round={round}
          initialAspect={
            editor.mode === "recrop" && value
              ? nearestAspect(aspects, cropAspect(value))
              : aspects[0].value
          }
          initialArea={
            editor.mode === "recrop" && value
              ? { x: value.cropX, y: value.cropY, width: value.cropWidth, height: value.cropHeight }
              : undefined
          }
          busy={busy}
          confirmLabel={editor.mode === "upload" ? "Usar esta foto" : "Guardar recorte"}
          onConfirm={confirm}
          onCancel={closeEditor}
        />
      )}
    </div>
  );
}