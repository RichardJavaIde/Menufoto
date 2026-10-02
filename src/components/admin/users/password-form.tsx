//src/components/admin/users/password-form.tsx
"use client";

import { useState, useTransition } from "react";
import { changePasswordAction } from "@/actions/users";
import { notify } from "@/lib/notify";
import { Spinner } from "@/components/ui/spinner";
import { inputClass, primaryButton, secondaryButton } from "@/components/ui/styles";
import type { UserRow } from "./types";

export function PasswordForm({
  user,
  onDone,
  onCancel,
}: {
  user: UserRow;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [password, setPassword] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await changePasswordAction({ id: user.id, password });
      if (notify(result)) onDone();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-neutral-600">
        Nueva contraseña para <strong>{user.name}</strong>
      </p>
      <div>
        <label htmlFor="p-password" className="block text-sm font-medium">
          Contraseña
        </label>
        <input
          id="p-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-neutral-500">Mínimo 8 caracteres</p>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} disabled={pending} className={secondaryButton}>
          Cancelar
        </button>
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending && <Spinner className="h-4 w-4" />}
          Cambiar contraseña
        </button>
      </div>
    </form>
  );
}