//src/components/admin/dishes/dishes-manager.tsx
"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  PackageCheck,
  PackageX,
  Trash2,
  Search,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import { inputClass, primaryButton } from "@/components/ui/styles";
import { notify } from "@/lib/notify";
import { formatPrice } from "@/lib/format";
import { moveDishAction, toggleDishFlagAction, deleteDishAction } from "@/actions/dishes";
import { DishForm } from "./dish-form";
import type { CategoryOption, DishRow, TagOption } from "./types";

type ModalState =
  | { type: "create" }
  | { type: "edit"; dish: DishRow }
  | { type: "delete"; dish: DishRow }
  | null;

const iconButton =
  "rounded-md p-2 text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40";

export function DishesManager({
  dishes,
  categories,
  tags,
  currencySymbol,
}: {
  dishes: DishRow[];
  categories: CategoryOption[];
  tags: TagOption[];
  currencySymbol: string;
}) {
  const [modal, setModal] = useState<ModalState>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const close = () => setModal(null);
  const searching = query.trim() !== "";
  const tagById = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .filter((c) => filterCategory === "all" || c.id === filterCategory)
      .map((category) => {
        const all = dishes.filter((d) => d.categoryId === category.id);
        const shown = q
          ? all.filter(
              (d) =>
                d.name.toLowerCase().includes(q) ||
                (d.description ?? "").toLowerCase().includes(q)
            )
          : all;
        return { category, all, shown };
      })
      .filter((g) => g.shown.length > 0);
  }, [categories, dishes, filterCategory, query]);

  function move(dish: DishRow, direction: "up" | "down") {
    startTransition(async () => {
      const result = await moveDishAction({ id: dish.id, direction });
      if (!result.ok) toast.error(result.error);
    });
  }

  function toggle(dish: DishRow, field: "visible" | "available") {
    setBusyKey(`${dish.id}:${field}`);
    startTransition(async () => {
      notify(await toggleDishFlagAction({ id: dish.id, field }));
      setBusyKey(null);
    });
  }

  function confirmDelete(dish: DishRow) {
    startTransition(async () => {
      if (notify(await deleteDishAction({ id: dish.id }))) close();
    });
  }

  const defaultCategoryId =
    filterCategory !== "all" ? filterCategory : (categories[0]?.id ?? "");

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Platos</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Los platos aparecen en el orden de esta lista, agrupados por categoría.
          </p>
        </div>
        <button
          onClick={() => setModal({ type: "create" })}
          disabled={categories.length === 0}
          className={primaryButton}
        >
          <Plus className="h-4 w-4" />
          Nuevo plato
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="mt-6 rounded-xl bg-white p-10 text-center text-sm text-neutral-500 ring-1 ring-neutral-200">
          Primero crea al menos una categoría para poder agregar platos.
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 mt-0.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar plato…"
                className={`${inputClass} mt-0 pl-9`}
                aria-label="Buscar plato"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className={`${inputClass} mt-0 sm:w-60`}
              aria-label="Filtrar por categoría"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {searching && (
            <p className="mt-2 text-xs text-neutral-500">
              Limpia la búsqueda para poder reordenar los platos.
            </p>
          )}

          {groups.length === 0 ? (
            <div className="mt-6 rounded-xl bg-white p-10 text-center text-sm text-neutral-500 ring-1 ring-neutral-200">
              {searching || dishes.length > 0
                ? "No hay platos que coincidan."
                : "Aún no hay platos. Crea el primero."}
            </div>
          ) : (
            groups.map(({ category, all, shown }) => (
              <section key={category.id} className="mt-8">
                <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                  {category.name}
                  {!category.active && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium normal-case tracking-normal text-amber-800">
                      Categoría oculta
                    </span>
                  )}
                </h2>

                <ul className="divide-y divide-neutral-200 rounded-xl bg-white ring-1 ring-neutral-200">
                  {shown.map((d) => {
                    const position = all.findIndex((x) => x.id === d.id);
                    return (
                      <li
                        key={d.id}
                        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`font-medium ${d.visible ? "" : "text-neutral-400"}`}
                            >
                              {d.name}
                            </span>
                            <span className="text-sm font-medium text-neutral-700">
                              {formatPrice(d.priceCents, currencySymbol)}
                            </span>
                            {!d.available && (
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                                Agotado
                              </span>
                            )}
                            {!d.visible && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                                Oculto
                              </span>
                            )}
                          </div>
                          {d.description && (
                            <p className="mt-0.5 truncate text-sm text-neutral-500">
                              {d.description}
                            </p>
                          )}
                          {d.tagIds.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {d.tagIds.map((id) => {
                                const t = tagById.get(id);
                                if (!t) return null;
                                return (
                                  <span
                                    key={id}
                                    className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700"
                                  >
                                    {t.icon && <span aria-hidden>{t.icon} </span>}
                                    {t.name}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            onClick={() => move(d, "up")}
                            disabled={searching || position === 0 || isPending}
                            className={iconButton}
                            title="Subir"
                            aria-label="Subir"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => move(d, "down")}
                            disabled={searching || position === all.length - 1 || isPending}
                            className={iconButton}
                            title="Bajar"
                            aria-label="Bajar"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setModal({ type: "edit", dish: d })}
                            className={iconButton}
                            title="Editar"
                            aria-label="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggle(d, "available")}
                            disabled={busyKey === `${d.id}:available`}
                            className={iconButton}
                            title={d.available ? "Marcar como agotado" : "Marcar como disponible"}
                            aria-label={d.available ? "Marcar como agotado" : "Marcar como disponible"}
                          >
                            {busyKey === `${d.id}:available` ? (
                              <Spinner className="h-4 w-4" />
                            ) : d.available ? (
                              <PackageCheck className="h-4 w-4" />
                            ) : (
                              <PackageX className="h-4 w-4 text-red-600" />
                            )}
                          </button>
                          <button
                            onClick={() => toggle(d, "visible")}
                            disabled={busyKey === `${d.id}:visible`}
                            className={iconButton}
                            title={d.visible ? "Ocultar del menú" : "Mostrar en el menú"}
                            aria-label={d.visible ? "Ocultar del menú" : "Mostrar en el menú"}
                          >
                            {busyKey === `${d.id}:visible` ? (
                              <Spinner className="h-4 w-4" />
                            ) : d.visible ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => setModal({ type: "delete", dish: d })}
                            className={`${iconButton} hover:text-red-600`}
                            title="Eliminar"
                            aria-label="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </>
      )}

      {modal?.type === "create" && (
        <Modal title="Nuevo plato" onClose={close}>
          <DishForm
            categories={categories}
            tags={tags}
            currencySymbol={currencySymbol}
            defaultCategoryId={defaultCategoryId}
            onDone={close}
            onCancel={close}
          />
        </Modal>
      )}

      {modal?.type === "edit" && (
        <Modal title="Editar plato" onClose={close}>
          <DishForm
            dish={modal.dish}
            categories={categories}
            tags={tags}
            currencySymbol={currencySymbol}
            defaultCategoryId={modal.dish.categoryId}
            onDone={close}
            onCancel={close}
          />
        </Modal>
      )}

      {modal?.type === "delete" && (
        <ConfirmDialog
          title="Eliminar plato"
          message={`¿Seguro que quieres eliminar "${modal.dish.name}"? Esta acción no se puede deshacer.`}
          pending={isPending}
          onConfirm={() => confirmDelete(modal.dish)}
          onCancel={close}
        />
      )}
    </div>
  );
}