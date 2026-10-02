//src/components/admin/users/user-form.tsx
"use client";

import { useState, useTransition } from "react";
import { createUserAction, updateUserAction } from "@/actions/users";
import { notify } from "@/lib/notify";
import { Spinner } from "@/components/ui/spinner";
import { inputClass, primaryButton, secondaryButton } from "@/components/ui/styles";
import type { UserRow } from "./types";

export function UserForm({
  user,
  isSelf,
  onDone,
  onCancel,
}: {
  user?: UserRow;
  isSelf?: boolean;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "USER">(user?.role ?? "USER");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = user
        ? await updateUserAction({ id: user.id, name, email, role })
        : await createUserAction({ name, email, password, role });
      if (notify(result)) onDone();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="u-name" className="block text-sm font-medium">
          Nombre
        </label>
        <input
          id="u-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="u-email" className="block text-sm font-medium">
          Correo
        </label>
        <input
          id="u-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={inputClass}
        />
      </div>

      {!user && (
        <div>
          <label htmlFor="u-password" className="block text-sm font-medium">
            Contraseña
          </label>
          <input
            id="u-password"
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
      )}

      <div>
        <label htmlFor="u-role" className="block text-sm font-medium">
          Rol
        </label>
        <select
          id="u-role"
          value={role}
          onChange={(e) => setRole(e.target.value as "ADMIN" | "USER")}
          disabled={isSelf}
          className={inputClass}
        >
          <option value="USER">Usuario (sin Configuración ni Usuarios)</option>
          <option value="ADMIN">Administrador (acceso total)</option>
        </select>
        {isSelf && (
          <p className="mt-1 text-xs text-neutral-500">No puedes cambiar tu propio rol</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} disabled={pending} className={secondaryButton}>
          Cancelar
        </button>
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending && <Spinner className="h-4 w-4" />}
          {user ? "Guardar cambios" : "Crear usuario"}
        </button>
      </div>
    </form>
  );
}