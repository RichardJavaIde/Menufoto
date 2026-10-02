//src/components/admin/categories/categories-manager.tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, ArrowUp, ArrowDown, Eye, EyeOff, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import { primaryButton } from "@/components/ui/styles";
import { notify } from "@/lib/notify";
import {
  moveCategoryAction,
  toggleCategoryActiveAction,
  deleteCategoryAction,
} from "@/actions/categories";
import { CategoryForm } from "./category-form";
import type { CategoryRow } from "./types";

type ModalState =
  | { type: "create" }
  | { type: "edit"; category: CategoryRow }
  | { type: "delete"; category: CategoryRow }
  | null;

const iconButton =
  "rounded-md p-2 text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40";

export function CategoriesManager({ categories }: { categories: CategoryRow[] }) {
  const [modal, setModal] = useState<ModalState>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const close = () => setModal(null);

  function move(category: CategoryRow, direction: "up" | "down") {
    startTransition(async () => {
      const result = await moveCategoryAction({ id: category.id, direction });
      if (!result.ok) toast.error(result.error);
    });
  }

  function toggleActive(category: CategoryRow) {
    setBusyId(category.id);
    startTransition(async () => {
      notify(await toggleCategoryActiveAction({ id: category.id }));
      setBusyId(null);
    });
  }

  function confirmDelete(category: CategoryRow) {
    startTransition(async () => {
      if (notify(await deleteCategoryAction({ id: category.id }))) close();
    });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Categorías</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Organiza tu carta. El orden de esta lista es el que verán los clientes.
          </p>
        </div>
        <button onClick={() => setModal({ type: "create" })} className={primaryButton}>
          <Plus className="h-4 w-4" />
          Nueva categoría
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="mt-6 rounded-xl bg-white p-10 text-center text-sm text-neutral-500 ring-1 ring-neutral-200">
          Aún no hay categorías. Crea la primera para empezar a armar tu carta.
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-neutral-200 rounded-xl bg-white ring-1 ring-neutral-200">
          {categories.map((c, index) => (
            <li
              key={c.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium text-neutral-600">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`font-medium ${c.active ? "" : "text-neutral-400"}`}>
                      {c.name}
                    </span>
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">
                      {c.dishCount} {c.dishCount === 1 ? "plato" : "platos"}
                    </span>
                    {!c.active && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        Oculta
                      </span>
                    )}
                  </div>
                  {c.description && (
                    <p className="mt-0.5 truncate text-sm text-neutral-500">{c.description}</p>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => move(c, "up")}
                  disabled={index === 0 || isPending}
                  className={iconButton}
                  title="Subir"
                  aria-label="Subir"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => move(c, "down")}
                  disabled={index === categories.length - 1 || isPending}
                  className={iconButton}
                  title="Bajar"
                  aria-label="Bajar"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setModal({ type: "edit", category: c })}
                  className={iconButton}
                  title="Editar"
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => toggleActive(c)}
                  disabled={busyId === c.id}
                  className={iconButton}
                  title={c.active ? "Ocultar del menú" : "Mostrar en el menú"}
                  aria-label={c.active ? "Ocultar del menú" : "Mostrar en el menú"}
                >
                  {busyId === c.id ? (
                    <Spinner className="h-4 w-4" />
                  ) : c.active ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => setModal({ type: "delete", category: c })}
                  disabled={c.dishCount > 0}
                  className={`${iconButton} hover:text-red-600`}
                  title={
                    c.dishCount > 0
                      ? "Tiene platos: muévelos o elimínalos primero"
                      : "Eliminar"
                  }
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {modal?.type === "create" && (
        <Modal title="Nueva categoría" onClose={close}>
          <CategoryForm onDone={close} onCancel={close} />
        </Modal>
      )}

      {modal?.type === "edit" && (
        <Modal title="Editar categoría" onClose={close}>
          <CategoryForm category={modal.category} onDone={close} onCancel={close} />
        </Modal>
      )}

      {modal?.type === "delete" && (
        <ConfirmDialog
          title="Eliminar categoría"
          message={`¿Seguro que quieres eliminar "${modal.category.name}"? Esta acción no se puede deshacer.`}
          pending={isPending}
          onConfirm={() => confirmDelete(modal.category)}
          onCancel={close}
        />
      )}
    </div>
  );
}