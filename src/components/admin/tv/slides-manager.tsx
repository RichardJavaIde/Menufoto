//src/components/admin/tv/slides-manager.tsx
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  BadgePercent,
  ExternalLink,
  Images,
  LayoutList,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Star,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { primaryButton } from "@/components/ui/styles";
import { notify } from "@/lib/notify";
import {
  moveSlideAction,
  toggleSlideActiveAction,
  deleteSlideAction,
} from "@/actions/tv-slides";
import { AddSlideForm, SlideForm } from "./slide-form";
import {
  EFFECT_LABEL,
  TYPE_INFO,
  scheduleSummary,
  type CategoryOption,
  type SlideRow,
  type SlideType,
} from "./slide-meta";

type ModalState =
  | { type: "add" }
  | { type: "edit"; slide: SlideRow }
  | { type: "delete"; slide: SlideRow }
  | null;

const ICONS: Record<SlideType, LucideIcon> = {
  OFFERS: BadgePercent,
  POPULAR: Star,
  CATEGORY: LayoutList,
  GALLERY: Images,
};

const iconButton =
  "rounded-md p-2 text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40";

export function SlidesManager({
  screen,
  slides,
  categories,
}: {
  screen: { id: string; name: string; link: string };
  slides: SlideRow[];
  categories: CategoryOption[];
}) {
  const [modal, setModal] = useState<ModalState>(null);
  const [isPending, startTransition] = useTransition();

  const close = () => setModal(null);

  function move(slide: SlideRow, direction: "up" | "down") {
    startTransition(async () => {
      const result = await moveSlideAction({ id: slide.id, direction });
      if (!result.ok) toast.error(result.error);
    });
  }

  function toggle(slide: SlideRow) {
    startTransition(async () => {
      notify(await toggleSlideActiveAction({ id: slide.id }));
    });
  }

  function confirmDelete(slide: SlideRow) {
    startTransition(async () => {
      if (notify(await deleteSlideAction({ id: slide.id }))) close();
    });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin/tv"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Pantallas
      </Link>

      <div className="mt-2 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{screen.name}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Las diapositivas se muestran en este orden. Los cambios llegan a la TV al terminar la
            vuelta.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href={`/tv/${screen.link}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100"
          >
            <ExternalLink className="h-4 w-4" />
            Ver pantalla
          </a>
          <button onClick={() => setModal({ type: "add" })} className={primaryButton}>
            <Plus className="h-4 w-4" />
            Agregar
          </button>
        </div>
      </div>

      {slides.length === 0 ? (
        <div className="mt-6 rounded-xl bg-white p-10 text-center text-sm text-neutral-500 ring-1 ring-neutral-200">
          Esta pantalla no tiene diapositivas. Agrega la primera.
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-neutral-200 rounded-xl bg-white ring-1 ring-neutral-200">
          {slides.map((s, index) => {
            const Icon = ICONS[s.type];
            const missingCategory = s.type === "CATEGORY" && !s.categoryName;
            return (
              <li
                key={s.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium text-neutral-600">
                    {index + 1}
                  </span>
                  <Icon className="h-5 w-5 shrink-0 text-neutral-700" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-medium ${s.active ? "" : "text-neutral-400"}`}>
                        {s.type === "CATEGORY" && s.categoryName
                          ? `Categoría: ${s.categoryName}`
                          : TYPE_INFO[s.type].label}
                      </span>
                      {!s.active && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          En pausa
                        </span>
                      )}
                      {missingCategory && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                          Sin categoría
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500">
                      {s.seconds} s · {EFFECT_LABEL[s.effect]} ·{" "}
                      {scheduleSummary(s.days, s.startMinute, s.endMinute)}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => move(s, "up")}
                    disabled={index === 0 || isPending}
                    className={iconButton}
                    title="Subir"
                    aria-label="Subir"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => move(s, "down")}
                    disabled={index === slides.length - 1 || isPending}
                    className={iconButton}
                    title="Bajar"
                    aria-label="Bajar"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setModal({ type: "edit", slide: s })}
                    className={iconButton}
                    title="Editar"
                    aria-label="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => toggle(s)}
                    disabled={isPending}
                    className={iconButton}
                    title={s.active ? "Pausar" : "Activar"}
                    aria-label={s.active ? "Pausar" : "Activar"}
                  >
                    {s.active ? (
                      <Power className="h-4 w-4" />
                    ) : (
                      <PowerOff className="h-4 w-4 text-amber-600" />
                    )}
                  </button>
                  <button
                    onClick={() => setModal({ type: "delete", slide: s })}
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
      )}

      {modal?.type === "add" && (
        <Modal title="Agregar diapositiva" onClose={close}>
          <AddSlideForm
            screenId={screen.id}
            categories={categories}
            onDone={close}
            onCancel={close}
          />
        </Modal>
      )}

      {modal?.type === "edit" && (
        <Modal title="Editar diapositiva" onClose={close}>
          <SlideForm
            slide={modal.slide}
            categories={categories}
            onDone={close}
            onCancel={close}
          />
        </Modal>
      )}

      {modal?.type === "delete" && (
        <ConfirmDialog
          title="Eliminar diapositiva"
          message="¿Seguro que quieres eliminar esta diapositiva? Esta acción no se puede deshacer."
          pending={isPending}
          onConfirm={() => confirmDelete(modal.slide)}
          onCancel={close}
        />
      )}
    </div>
  );
}