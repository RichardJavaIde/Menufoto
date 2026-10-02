//src/components/admin/dishes/dish-form.tsx
"use client";

import { useState, useTransition } from "react";
import { createDishAction, updateDishAction } from "@/actions/dishes";
import { notify } from "@/lib/notify";
import { Spinner } from "@/components/ui/spinner";
import { inputClass, primaryButton, secondaryButton } from "@/components/ui/styles";
import type { CategoryOption, DishRow, TagOption } from "./types";

export function DishForm({
  dish,
  categories,
  tags,
  currencySymbol,
  defaultCategoryId,
  onDone,
  onCancel,
}: {
  dish?: DishRow;
  categories: CategoryOption[];
  tags: TagOption[];
  currencySymbol: string;
  defaultCategoryId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(dish?.name ?? "");
  const [description, setDescription] = useState(dish?.description ?? "");
  const [price, setPrice] = useState(dish ? (dish.priceCents / 100).toFixed(2) : "");
  const [categoryId, setCategoryId] = useState(dish?.categoryId ?? defaultCategoryId);
  const [tagIds, setTagIds] = useState<string[]>(dish?.tagIds ?? []);
  const [visible, setVisible] = useState(dish?.visible ?? true);
  const [available, setAvailable] = useState(dish?.available ?? true);
  const [pending, startTransition] = useTransition();

  function toggleTag(id: string) {
    setTagIds((current) =>
      current.includes(id) ? current.filter((t) => t !== id) : [...current, id]
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { name, description, price, categoryId, tagIds, visible, available };
    startTransition(async () => {
      const result = dish
        ? await updateDishAction({ id: dish.id, ...payload })
        : await createDishAction(payload);
      if (notify(result)) onDone();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="d-name" className="block text-sm font-medium">
          Nombre
        </label>
        <input
          id="d-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={80}
          placeholder="Ej: Sancocho de tres carnes"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="d-category" className="block text-sm font-medium">
            Categoría
          </label>
          <select
            id="d-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className={inputClass}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="d-price" className="block text-sm font-medium">
            Precio
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 mt-0.5 -translate-y-1/2 text-sm text-neutral-500">
              {currencySymbol}
            </span>
            <input
              id="d-price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              inputMode="decimal"
              placeholder="0.00"
              className={`${inputClass} pl-12`}
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="d-description" className="block text-sm font-medium">
          Descripción <span className="font-normal text-neutral-500">(opcional)</span>
        </label>
        <textarea
          id="d-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={400}
          placeholder="Ingredientes, forma de preparación, acompañamientos…"
          className={inputClass}
        />
      </div>

      {tags.length > 0 && (
        <div>
          <p className="block text-sm font-medium">Etiquetas</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((t) => {
              const selected = tagIds.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTag(t.id)}
                  aria-pressed={selected}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm ${
                    selected
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-800 hover:bg-neutral-200"
                  }`}
                >
                  {t.icon && <span aria-hidden>{t.icon}</span>}
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => setVisible(e.target.checked)}
            className="h-4 w-4"
          />
          Visible en el menú
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
            className="h-4 w-4"
          />
          Disponible (si lo desmarcas se muestra como “Agotado”)
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} disabled={pending} className={secondaryButton}>
          Cancelar
        </button>
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending && <Spinner className="h-4 w-4" />}
          {dish ? "Guardar cambios" : "Crear plato"}
        </button>
      </div>
    </form>
  );
}