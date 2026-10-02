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

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;

const ASPECTS = [
  { label: "4:3", value: 4 / 3 },
  { label: "1:1", value: 1 },
  { label: "16:9", value: 16 / 9 },
  { label: "3:4", value: 3 / 4 },
];

const round = (v: number) => Math.round(v * 10000) / 10000;

function toCrop(area: Area) {
  const x = Math.min(100, Math.max(0, round(area.x)));
  const y = Math.min(100, Math.max(0, round(area.y)));
  return {
    x,
    y,
    width: Math.min(100, Math.max(1, round(area.width))),
    height: Math.min(100, Math.max(1, round(area.height))),
  };
}

function nearestAspect(value: number) {
  return ASPECTS.reduce((best, a) =>
    Math.abs(a.value - value) < Math.abs(best.value - value) ? a : best
  ).value;
}

type EditorState =
  | { mode: "upload"; file: File; src: string }
  | { mode: "recrop"; src: string }
  | null;

function ImageCropper({
  src,
  initialAspect,
  initialArea,
  busy,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  src: string;
  initialAspect?: number;
  initialArea?: Area;
  busy: boolean;
  confirmLabel: string;
  onConfirm: (area: Area) => void;
  onCancel: () => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(initialAspect ?? 4 / 3);
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
            initialCroppedAreaPercentages={initialArea}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(percent) => setArea(percent)}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {ASPECTS.map((a) => (
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
}: {
  value: ImageInfo | null;
  onChange: (value: ImageInfo | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editor, setEditor] = useState<EditorState>(null);
  const [busy, setBusy] = useState(false);

  function closeEditor() {
    if (editor?.mode === "upload") URL.revokeObjectURL(editor.src);
    setEditor(null);
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ACCEPTED.includes(file.type)) {
      toast.error("Formato no permitido. Usa JPG, PNG o WebP");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("La imagen supera el máximo de 8 MB");
      return;
    }
    setEditor({ mode: "upload", file, src: URL.createObjectURL(file) });
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
          ? "Foto lista. Guarda el plato para aplicarla."
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
        Fotografía <span className="font-normal text-neutral-500">(opcional)</span>
      </p>

      <div className="mt-2 flex items-start gap-4">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl(value.key, 480)}
            alt="Fotografía del plato"
            style={{ aspectRatio: cropAspect(value) }}
            className="w-40 rounded-lg object-cover ring-1 ring-neutral-200"
          />
        ) : (
          <div className="flex h-28 w-40 items-center justify-center rounded-lg border border-dashed border-neutral-300 text-neutral-400">
            <ImageIcon className="h-6 w-6" />
          </div>
        )}

        <div className="flex flex-col items-start gap-2">
          <button type="button" onClick={() => inputRef.current?.click()} className={secondaryButton}>
            {value ? <RefreshCw className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />}
            {value ? "Cambiar" : "Subir foto"}
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
                Quitar foto
              </button>
            </>
          )}
        </div>
      </div>

      <p className="mt-2 text-xs text-neutral-500">
        JPG, PNG o WebP · máximo 8 MB · mínimo 400 px por lado.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        onChange={onPick}
        className="hidden"
      />

      {editor && (
        <ImageCropper
          src={editor.src}
          initialAspect={
            editor.mode === "recrop" && value ? nearestAspect(cropAspect(value)) : undefined
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