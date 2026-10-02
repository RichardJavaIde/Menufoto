//src/components/admin/tags/tag-form.tsx
"use client";

import { useState, useTransition } from "react";
import { createTagAction, updateTagAction } from "@/actions/tags";
import { notify } from "@/lib/notify";
import { Spinner } from "@/components/ui/spinner";
import { inputClass, primaryButton, secondaryButton } from "@/components/ui/styles";
import { TagPill } from "./tag-pill";
import type { TagRow } from "./types";

const EMOJIS = [
  "🌱", "🌶️", "✨", "⭐", "🔥", "🥩", "🐟", "🍤",
  "🥗", "🍰", "🥛", "🌾", "❤️", "🍷", "🥜", "🍯",
];

export function TagForm({
  tag,
  onDone,
  onCancel,
}: {
  tag?: TagRow;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(tag?.name ?? "");
  const [icon, setIcon] = useState(tag?.icon ?? "");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = tag
        ? await updateTagAction({ id: tag.id, name, icon })
        : await createTagAction({ name, icon });
      if (notify(result)) onDone();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="t-name" className="block text-sm font-medium">
          Nombre
        </label>
        <input
          id="t-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={40}
          placeholder="Ej: Vegetariano"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="t-icon" className="block text-sm font-medium">
          Ícono <span className="font-normal text-neutral-500">(opcional)</span>
        </label>
        <input
          id="t-icon"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          maxLength={8}
          placeholder="Escribe o elige un emoji"
          className={inputClass}
        />
        <div className="mt-2 flex flex-wrap gap-1">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setIcon(emoji)}
              className={`h-9 w-9 rounded-md text-lg hover:bg-neutral-100 ${
                icon === emoji ? "bg-neutral-200" : ""
              }`}
              aria-label={`Usar ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
        {icon && (
          <button
            type="button"
            onClick={() => setIcon("")}
            className="mt-2 text-xs text-neutral-500 underline"
          >
            Quitar ícono
          </button>
        )}
      </div>

      <div>
        <p className="mb-1 text-sm font-medium">Vista previa</p>
        <TagPill name={name.trim() || "Etiqueta"} icon={icon.trim() || null} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} disabled={pending} className={secondaryButton}>
          Cancelar
        </button>
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending && <Spinner className="h-4 w-4" />}
          {tag ? "Guardar cambios" : "Crear etiqueta"}
        </button>
      </div>
    </form>
  );
}