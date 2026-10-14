//src/components/admin/tv/screen-form.tsx
"use client";

import { useState, useTransition } from "react";
import { createScreenAction, updateScreenAction } from "@/actions/tv";
import { notify } from "@/lib/notify";
import { Spinner } from "@/components/ui/spinner";
import { inputClass, primaryButton, secondaryButton } from "@/components/ui/styles";
import type { ScreenRow } from "./types";

const PRESETS = [
  { value: "PROMO", label: "Promociones", hint: "Ofertas y platos populares." },
  { value: "MENU", label: "Menú", hint: "Una diapositiva por cada categoría activa." },
  { value: "EMPTY", label: "Vacía", hint: "Sin diapositivas; las agregas tú después." },
] as const;

type Preset = (typeof PRESETS)[number]["value"];

export function ScreenForm({
  screen,
  onDone,
  onCancel,
}: {
  screen?: ScreenRow;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(screen?.name ?? "");
  const [link, setLink] = useState(screen?.link ?? "");
  const [preset, setPreset] = useState<Preset>("PROMO");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = screen
        ? await updateScreenAction({ id: screen.id, name, link })
        : await createScreenAction({ name, link, preset });
      if (notify(result)) onDone();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="s-name" className="block text-sm font-medium">
          Nombre
        </label>
        <input
          id="s-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={60}
          placeholder="Ej: Pantalla 1 · Promociones"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="s-link" className="block text-sm font-medium">
          Enlace
          {!screen && <span className="font-normal text-neutral-500"> (opcional)</span>}
        </label>
        <div className="mt-1 flex items-center">
          <span className="rounded-l-md border border-r-0 border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-500">
            /tv/
          </span>
          <input
            id="s-link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            required={Boolean(screen)}
            maxLength={40}
            placeholder={screen ? "1" : "Automático: 1, 2, 3…"}
            className="w-full rounded-r-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          Solo letras, números y guiones. Si lo cambias, hay que escribir el enlace nuevo en la TV.
        </p>
      </div>

      {!screen && (
        <fieldset>
          <legend className="block text-sm font-medium">Modelo inicial</legend>
          <div className="mt-2 space-y-2">
            {PRESETS.map((p) => (
              <label
                key={p.value}
                className={`flex cursor-pointer items-start gap-3 rounded-lg p-3 ring-1 ${
                  preset === p.value
                    ? "bg-neutral-50 ring-neutral-900"
                    : "ring-neutral-200 hover:bg-neutral-50"
                }`}
              >
                <input
                  type="radio"
                  name="preset"
                  value={p.value}
                  checked={preset === p.value}
                  onChange={() => setPreset(p.value)}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-medium">{p.label}</span>
                  <span className="block text-xs text-neutral-500">{p.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} disabled={pending} className={secondaryButton}>
          Cancelar
        </button>
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending && <Spinner className="h-4 w-4" />}
          {screen ? "Guardar cambios" : "Crear pantalla"}
        </button>
      </div>
    </form>
  );
}