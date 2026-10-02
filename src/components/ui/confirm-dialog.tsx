//src/components/ui/confirm-dialog.tsx
"use client";

import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { dangerButton, secondaryButton } from "@/components/ui/styles";

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Eliminar",
  pending,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-neutral-600">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onCancel} disabled={pending} className={secondaryButton}>
          Cancelar
        </button>
        <button onClick={onConfirm} disabled={pending} className={dangerButton}>
          {pending && <Spinner className="h-4 w-4" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}