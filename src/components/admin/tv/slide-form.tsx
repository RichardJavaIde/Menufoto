//src/components/admin/tv/slide-form.tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createSlideAction, updateSlideAction } from "@/actions/tv-slides";
import { notify } from "@/lib/notify";
import { GALLERY_LIMITS } from "@/lib/tv-frames";
import { Spinner } from "@/components/ui/spinner";
import { inputClass, primaryButton, secondaryButton } from "@/components/ui/styles";
import { GalleryImages } from "./gallery-images";
import {
  DAY_ORDER,
  DAY_SHORT,
  EFFECTS,
  GALLERY_MODES,
  TYPE_INFO,
  daysFromMask,
  minutesToTime,
  type CategoryOption,
  type GalleryImage,
  type GalleryMode,
  type SlideEffect,
  type SlideRow,
} from "./slide-meta";

// ---------- Agregar ----------

const ADDABLE = ["OFFERS", "POPULAR", "CATEGORY", "GALLERY"] as const;
type Addable = (typeof ADDABLE)[number];

export function AddSlideForm({
  screenId,
  categories,
  onDone,
  onCancel,
}: {
  screenId: string;
  categories: CategoryOption[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState<Addable>("OFFERS");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [pending, startTransition] = useTransition();

  const blocked = type === "CATEGORY" && categories.length === 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createSlideAction({
        screenId,
        type,
        categoryId: type === "CATEGORY" ? categoryId || null : null,
      });
      if (notify(result)) onDone();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <fieldset>
        <legend className="block text-sm font-medium">Tipo de diapositiva</legend>
        <div className="mt-2 space-y-2">
          {ADDABLE.map((t) => (
            <label
              key={t}
              className={`flex cursor-pointer items-start gap-3 rounded-lg p-3 ring-1 ${
                type === t ? "bg-neutral-50 ring-neutral-900" : "ring-neutral-200 hover:bg-neutral-50"
              }`}
            >
              <input
                type="radio"
                name="slide-type"
                checked={type === t}
                onChange={() => setType(t)}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium">{TYPE_INFO[t].label}</span>
                <span className="block text-xs text-neutral-500">{TYPE_INFO[t].hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {type === "CATEGORY" && (
        <div>
          <label htmlFor="a-category" className="block text-sm font-medium">
            Categoría
          </label>
          {categories.length === 0 ? (
            <p className="mt-1 text-sm text-amber-700">No hay categorías activas.</p>
          ) : (
            <select
              id="a-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={inputClass}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} disabled={pending} className={secondaryButton}>
          Cancelar
        </button>
        <button type="submit" disabled={pending || blocked} className={primaryButton}>
          {pending && <Spinner className="h-4 w-4" />}
          Agregar
        </button>
      </div>
    </form>
  );
}

// ---------- Editar ----------

export function SlideForm({
  slide,
  categories,
  onDone,
  onCancel,
}: {
  slide: SlideRow;
  categories: CategoryOption[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const isGallery = slide.type === "GALLERY";
  const hasSchedule =
    slide.days !== null || slide.startMinute !== null || slide.endMinute !== null;

  const [seconds, setSeconds] = useState(String(slide.seconds));
  const [effect, setEffect] = useState<SlideEffect>(
    isGallery && slide.effect === "KENBURNS" ? "FADE" : slide.effect
  );
  const [active, setActive] = useState(slide.active);
  const [categoryId, setCategoryId] = useState(slide.categoryId ?? "");
  const [mode, setMode] = useState<GalleryMode>(slide.galleryMode);
  const [images, setImages] = useState<GalleryImage[]>(slide.images);
  const [custom, setCustom] = useState(hasSchedule);
  const [days, setDays] = useState<number[]>(daysFromMask(slide.days));
  const [start, setStart] = useState(minutesToTime(slide.startMinute));
  const [end, setEnd] = useState(minutesToTime(slide.endMinute));
  const [pending, startTransition] = useTransition();

  const limit = GALLERY_LIMITS[mode];
  // Los flyers no usan Ken Burns para no tapar el texto
  const effects = isGallery ? EFFECTS.filter((e) => e.value !== "KENBURNS") : EFFECTS;

  function toggleDay(day: number) {
    setDays((current) =>
      current.includes(day) ? current.filter((d) => d !== day) : [...current, day]
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();

    if (isGallery && images.length > limit) {
      toast.error(
        `Este modo admite como máximo ${limit} ${limit === 1 ? "imagen" : "imágenes"}. Quita ${
          images.length - limit
        }.`
      );
      return;
    }

    startTransition(async () => {
      const result = await updateSlideAction({
        id: slide.id,
        seconds: Number(seconds),
        effect,
        active,
        days: custom ? days : [],
        start: custom ? start : "",
        end: custom ? end : "",
        categoryId: categoryId || null,
        ...(isGallery ? { galleryMode: mode, imageIds: images.map((i) => i.id) } : {}),
      });
      if (notify(result)) onDone();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm font-medium text-neutral-800">{TYPE_INFO[slide.type].label}</p>

      {slide.type === "CATEGORY" && (
        <div>
          <label htmlFor="e-category" className="block text-sm font-medium">
            Categoría
          </label>
          <select
            id="e-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={inputClass}
          >
            {!categoryId && <option value="">Selecciona una categoría</option>}
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {isGallery && (
        <>
          <fieldset>
            <legend className="block text-sm font-medium">Cómo se muestran</legend>
            <div className="mt-2 space-y-2">
              {GALLERY_MODES.map((m) => (
                <label
                  key={m.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg p-3 ring-1 ${
                    mode === m.value
                      ? "bg-neutral-50 ring-neutral-900"
                      : "ring-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="gallery-mode"
                    checked={mode === m.value}
                    onChange={() => setMode(m.value)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-medium">{m.label}</span>
                    <span className="block text-xs text-neutral-500">{m.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <GalleryImages images={images} onChange={setImages} max={limit} />

          {images.length > limit && (
            <p className="text-sm text-red-600">
              Tienes {images.length} imágenes y este modo admite {limit}. Quita{" "}
              {images.length - limit} para poder guardar.
            </p>
          )}
        </>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="e-seconds" className="block text-sm font-medium">
            {isGallery && mode === "SEQUENCE" ? "Segundos por imagen" : "Segundos"}
          </label>
          <input
            id="e-seconds"
            type="number"
            min={3}
            max={120}
            value={seconds}
            onChange={(e) => setSeconds(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="e-effect" className="block text-sm font-medium">
            Efecto
          </label>
          <select
            id="e-effect"
            value={effect}
            onChange={(e) => setEffect(e.target.value as SlideEffect)}
            className={inputClass}
          >
            {effects.map((ef) => (
              <option key={ef.value} value={ef.value}>
                {ef.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {!isGallery && (
        <p className="-mt-2 text-xs text-neutral-500">
          Si hay muchos platos, se reparten en páginas y cada una dura estos segundos.
        </p>
      )}

      <fieldset className="space-y-3 rounded-lg bg-neutral-50 p-4 ring-1 ring-neutral-200">
        <legend className="px-1 text-sm font-semibold">Cuándo se muestra</legend>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="schedule"
            checked={!custom}
            onChange={() => setCustom(false)}
          />
          Siempre
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="schedule"
            checked={custom}
            onChange={() => setCustom(true)}
          />
          Solo en ciertos días u horas
        </label>

        {custom && (
          <div className="space-y-3 pt-1">
            <div>
              <p className="text-xs font-medium text-neutral-600">
                Días <span className="font-normal">(sin marcar = todos)</span>
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {DAY_ORDER.map((d) => {
                  const selected = days.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDay(d)}
                      aria-pressed={selected}
                      className={`rounded-full px-3 py-1 text-sm ${
                        selected
                          ? "bg-neutral-900 text-white"
                          : "bg-white text-neutral-800 ring-1 ring-neutral-300 hover:bg-neutral-100"
                      }`}
                    >
                      {DAY_SHORT[d]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="e-start" className="block text-xs font-medium text-neutral-600">
                  Desde <span className="font-normal">(opcional)</span>
                </label>
                <input
                  id="e-start"
                  type="time"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="e-end" className="block text-xs font-medium text-neutral-600">
                  Hasta <span className="font-normal">(opcional)</span>
                </label>
                <input
                  id="e-end"
                  type="time"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <p className="text-xs text-neutral-500">
              Las horas usan la zona horaria del restaurante. Puedes cruzar la medianoche, por
              ejemplo de 22:00 a 02:00.
            </p>
          </div>
        )}
      </fieldset>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="h-4 w-4"
        />
        Activa (si la desmarcas queda en pausa)
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} disabled={pending} className={secondaryButton}>
          Cancelar
        </button>
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending && <Spinner className="h-4 w-4" />}
          Guardar cambios
        </button>
      </div>
    </form>
  );
}