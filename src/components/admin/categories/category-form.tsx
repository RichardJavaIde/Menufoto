//src/components/admin/categories/category-form.tsx
"use client";

import { useState, useTransition } from "react";
import { createCategoryAction, updateCategoryAction } from "@/actions/categories";
import { notify } from "@/lib/notify";
import { Spinner } from "@/components/ui/spinner";
import { inputClass, primaryButton, secondaryButton } from "@/components/ui/styles";
import type { CategoryRow } from "./types";

export function CategoryForm({
  category,
  onDone,
  onCancel,
}: {
  category?: CategoryRow;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [active, setActive] = useState(category?.active ?? true);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = category
        ? await updateCategoryAction({ id: category.id, name, description, active })
        : await createCategoryAction({ name, description, active });
      if (notify(result)) onDone();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="c-name" className="block text-sm font-medium">
          Nombre
        </label>
        <input
          id="c-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={60}
          placeholder="Ej: Entradas"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="c-description" className="block text-sm font-medium">
          Descripción <span className="font-normal text-neutral-500">(opcional)</span>
        </label>
        <textarea
          id="c-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={200}
          placeholder="Ej: Para comenzar"
          className={inputClass}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="h-4 w-4"
        />
        Visible en el menú
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} disabled={pending} className={secondaryButton}>
          Cancelar
        </button>
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending && <Spinner className="h-4 w-4" />}
          {category ? "Guardar cambios" : "Crear categoría"}
        </button>
      </div>
    </form>
  );
}