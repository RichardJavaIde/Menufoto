//src/components/admin/users/users-manager.tsx
"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, KeyRound, Power, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import { primaryButton } from "@/components/ui/styles";
import { notify } from "@/lib/notify";
import { toggleUserActiveAction, deleteUserAction } from "@/actions/users";
import { UserForm } from "./user-form";
import { PasswordForm } from "./password-form";
import type { UserRow } from "./types";

type ModalState =
  | { type: "create" }
  | { type: "edit"; user: UserRow }
  | { type: "password"; user: UserRow }
  | { type: "delete"; user: UserRow }
  | null;

const iconButton =
  "rounded-md p-2 text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40";

export function UsersManager({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const [modal, setModal] = useState<ModalState>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const close = () => setModal(null);

  function toggleActive(user: UserRow) {
    setBusyId(user.id);
    startTransition(async () => {
      notify(await toggleUserActiveAction({ id: user.id }));
      setBusyId(null);
    });
  }

  function confirmDelete(user: UserRow) {
    startTransition(async () => {
      if (notify(await deleteUserAction({ id: user.id }))) close();
    });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Usuarios</h1>
          <p className="mt-1 text-sm text-neutral-500">Administra quién puede entrar al panel</p>
        </div>
        <button onClick={() => setModal({ type: "create" })} className={primaryButton}>
          <Plus className="h-4 w-4" />
          Nuevo usuario
        </button>
      </div>

      <ul className="mt-6 divide-y divide-neutral-200 rounded-xl bg-white ring-1 ring-neutral-200">
        {users.map((u) => {
          const isSelf = u.id === currentUserId;
          return (
            <li
              key={u.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`font-medium ${u.active ? "" : "text-neutral-400 line-through"}`}>
                    {u.name}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.role === "ADMIN"
                        ? "bg-neutral-900 text-white"
                        : "bg-neutral-100 text-neutral-700"
                    }`}
                  >
                    {u.role === "ADMIN" ? "Administrador" : "Usuario"}
                  </span>
                  {!u.active && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      Inactivo
                    </span>
                  )}
                  {isSelf && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                      Tú
                    </span>
                  )}
                </div>
                <p className="truncate text-sm text-neutral-500">{u.email}</p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => setModal({ type: "edit", user: u })}
                  className={iconButton}
                  title="Editar"
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setModal({ type: "password", user: u })}
                  className={iconButton}
                  title="Cambiar contraseña"
                  aria-label="Cambiar contraseña"
                >
                  <KeyRound className="h-4 w-4" />
                </button>
                <button
                  onClick={() => toggleActive(u)}
                  disabled={isSelf || busyId === u.id}
                  className={iconButton}
                  title={
                    isSelf
                      ? "No puedes desactivar tu propia cuenta"
                      : u.active
                        ? "Desactivar"
                        : "Activar"
                  }
                  aria-label={u.active ? "Desactivar" : "Activar"}
                >
                  {busyId === u.id ? <Spinner className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setModal({ type: "delete", user: u })}
                  disabled={isSelf}
                  className={`${iconButton} hover:text-red-600`}
                  title={isSelf ? "No puedes eliminar tu propia cuenta" : "Eliminar"}
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {modal?.type === "create" && (
        <Modal title="Nuevo usuario" onClose={close}>
          <UserForm onDone={close} onCancel={close} />
        </Modal>
      )}

      {modal?.type === "edit" && (
        <Modal title="Editar usuario" onClose={close}>
          <UserForm
            user={modal.user}
            isSelf={modal.user.id === currentUserId}
            onDone={close}
            onCancel={close}
          />
        </Modal>
      )}

      {modal?.type === "password" && (
        <Modal title="Cambiar contraseña" onClose={close}>
          <PasswordForm user={modal.user} onDone={close} onCancel={close} />
        </Modal>
      )}

      {modal?.type === "delete" && (
        <ConfirmDialog
          title="Eliminar usuario"
          message={`¿Seguro que quieres eliminar a ${modal.user.name}? Esta acción no se puede deshacer.`}
          pending={isPending}
          onConfirm={() => confirmDelete(modal.user)}
          onCancel={close}
        />
      )}
    </div>
  );
}