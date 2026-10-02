//src/components/admin/tags/tags-manager.tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { primaryButton } from "@/components/ui/styles";
import { notify } from "@/lib/notify";
import { moveTagAction, deleteTagAction } from "@/actions/tags";
import { TagForm } from "./tag-form";
import { TagPill } from "./tag-pill";
import type { TagRow } from "./types";

type ModalState =
  | { type: "create" }
  | { type: "edit"; tag: TagRow }
  | { type: "delete"; tag: TagRow }
  | null;

const iconButton =
  "rounded-md p-2 text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40";

export function TagsManager({ tags }: { tags: TagRow[] }) {
  const [modal, setModal] = useState<ModalState>(null);
  const [isPending, startTransition] = useTransition();

  const close = () => setModal(null);

  function move(tag: TagRow, direction: "up" | "down") {
    startTransition(async () => {
      const result = await moveTagAction({ id: tag.id, direction });
      if (!result.ok) toast.error(result.error);
    });
  }

  function confirmDelete(tag: TagRow) {
    startTransition(async () => {
      if (notify(await deleteTagAction({ id: tag.id }))) close();
    });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Etiquetas</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Marcas que puedes asignar a los platos: vegetariano, picante, nuevo…
          </p>
        </div>
        <button onClick={() => setModal({ type: "create" })} className={primaryButton}>
          <Plus className="h-4 w-4" />
          Nueva etiqueta
        </button>
      </div>

      {tags.length === 0 ? (
        <div className="mt-6 rounded-xl bg-white p-10 text-center text-sm text-neutral-500 ring-1 ring-neutral-200">
          Aún no hay etiquetas. Crea la primera.
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-neutral-200 rounded-xl bg-white ring-1 ring-neutral-200">
          {tags.map((t, index) => (
            <li
              key={t.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium text-neutral-600">
                  {index + 1}
                </span>
                <TagPill name={t.name} icon={t.icon} />
                <span className="text-xs text-neutral-500">
                  {t.dishCount} {t.dishCount === 1 ? "plato" : "platos"}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => move(t, "up")}
                  disabled={index === 0 || isPending}
                  className={iconButton}
                  title="Subir"
                  aria-label="Subir"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => move(t, "down")}
                  disabled={index === tags.length - 1 || isPending}
                  className={iconButton}
                  title="Bajar"
                  aria-label="Bajar"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setModal({ type: "edit", tag: t })}
                  className={iconButton}
                  title="Editar"
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setModal({ type: "delete", tag: t })}
                  className={`${iconButton} hover:text-red-600`}
                  title="Eliminar"
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
        <Modal title="Nueva etiqueta" onClose={close}>
          <TagForm onDone={close} onCancel={close} />
        </Modal>
      )}

      {modal?.type === "edit" && (
        <Modal title="Editar etiqueta" onClose={close}>
          <TagForm tag={modal.tag} onDone={close} onCancel={close} />
        </Modal>
      )}

      {modal?.type === "delete" && (
        <ConfirmDialog
          title="Eliminar etiqueta"
          message={
            modal.tag.dishCount > 0
              ? `¿Eliminar "${modal.tag.name}"? Se quitará de ${modal.tag.dishCount} ${
                  modal.tag.dishCount === 1 ? "plato" : "platos"
                }. Los platos no se borran.`
              : `¿Seguro que quieres eliminar "${modal.tag.name}"?`
          }
          pending={isPending}
          onConfirm={() => confirmDelete(modal.tag)}
          onCancel={close}
        />
      )}
    </div>
  );
}