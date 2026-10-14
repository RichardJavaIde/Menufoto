//src/components/admin/tv/tv-manager.tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { notify } from "@/lib/notify";
import { toggleScreenActiveAction, deleteScreenAction } from "@/actions/tv";
import { ScreenForm } from "./screen-form";
import type { ScreenRow } from "./types";
import Link from "next/link";
import { Plus, Pencil, Trash2, Copy, ExternalLink, Power, PowerOff, ListOrdered } from "lucide-react";
import { primaryButton, secondaryButton } from "@/components/ui/styles";

type ModalState =
  | { type: "create" }
  | { type: "edit"; screen: ScreenRow }
  | { type: "delete"; screen: ScreenRow }
  | null;

const iconButton =
  "rounded-md p-2 text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40";

export function TvManager({ screens }: { screens: ScreenRow[] }) {
  const [modal, setModal] = useState<ModalState>(null);
  const [isPending, startTransition] = useTransition();

  const close = () => setModal(null);

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado");
    } catch {
      toast.error("No se pudo copiar. Selecciona el enlace y cópialo manualmente.");
    }
  }

  function toggle(screen: ScreenRow) {
    startTransition(async () => {
      notify(await toggleScreenActiveAction({ id: screen.id }));
    });
  }

  function confirmDelete(screen: ScreenRow) {
    startTransition(async () => {
      if (notify(await deleteScreenAction({ id: screen.id }))) close();
    });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Pantalla TV</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Cada pantalla tiene su propio enlace. Escríbelo una sola vez en el navegador del
            televisor y déjalo fijo.
          </p>
        </div>
        <button onClick={() => setModal({ type: "create" })} className={primaryButton}>
          <Plus className="h-4 w-4" />
          Nueva pantalla
        </button>
      </div>

      {screens.length === 0 ? (
        <div className="mt-6 rounded-xl bg-white p-10 text-center text-sm text-neutral-500 ring-1 ring-neutral-200">
          Aún no hay pantallas. Crea la primera.
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {screens.map((s) => (
            <li key={s.id} className="rounded-xl bg-white p-4 ring-1 ring-neutral-200">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`font-medium ${s.active ? "" : "text-neutral-400"}`}>
                      {s.name}
                    </span>
                    {s.active ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        Activa
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        Desactivada
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {s.slideCount} {s.slideCount === 1 ? "diapositiva" : "diapositivas"} ·{" "}
                    {s.lastSeen ? `Última conexión: ${s.lastSeen}` : "Nunca se ha conectado"}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                                    <Link
                    href={`/admin/tv/${s.id}`}
                    className={`${secondaryButton} mr-1 px-3 py-1.5`}
                  >
                    <ListOrdered className="h-4 w-4" />
                    Diapositivas
                  </Link>
                  <button
                    onClick={() => copy(s.url)}
                    className={iconButton}
                    title="Copiar enlace"
                    aria-label="Copiar enlace"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={iconButton}
                    title="Abrir pantalla"
                    aria-label="Abrir pantalla"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => setModal({ type: "edit", screen: s })}
                    className={iconButton}
                    title="Editar nombre y enlace"
                    aria-label="Editar nombre y enlace"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => toggle(s)}
                    disabled={isPending}
                    className={iconButton}
                    title={s.active ? "Desactivar" : "Activar"}
                    aria-label={s.active ? "Desactivar" : "Activar"}
                  >
                    {s.active ? (
                      <Power className="h-4 w-4" />
                    ) : (
                      <PowerOff className="h-4 w-4 text-amber-600" />
                    )}
                  </button>
                  <button
                    onClick={() => setModal({ type: "delete", screen: s })}
                    className={`${iconButton} hover:text-red-600`}
                    title="Eliminar"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <input
                readOnly
                value={s.url}
                onFocus={(e) => e.currentTarget.select()}
                aria-label={`Enlace de ${s.name}`}
                className="mt-3 w-full rounded-md bg-neutral-50 px-3 py-2 font-mono text-xs text-neutral-600 outline-none ring-1 ring-neutral-200"
              />
            </li>
          ))}
        </ul>
      )}

      {modal?.type === "create" && (
        <Modal title="Nueva pantalla" onClose={close}>
          <ScreenForm onDone={close} onCancel={close} />
        </Modal>
      )}

      {modal?.type === "edit" && (
        <Modal title="Editar pantalla" onClose={close}>
          <ScreenForm screen={modal.screen} onDone={close} onCancel={close} />
        </Modal>
      )}

      {modal?.type === "delete" && (
        <ConfirmDialog
          title="Eliminar pantalla"
          message={`¿Seguro que quieres eliminar "${modal.screen.name}" y todas sus diapositivas? Esta acción no se puede deshacer.`}
          pending={isPending}
          onConfirm={() => confirmDelete(modal.screen)}
          onCancel={close}
        />
      )}
    </div>
  );
}