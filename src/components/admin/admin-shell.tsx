//src/components/admin/admin-shell.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Menu, X, LogOut,ExternalLink  } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { canAccess, type Role } from "@/lib/permissions";
import { NAV_ITEMS } from "@/components/admin/nav-items";
import { Spinner } from "@/components/ui/spinner";

type ShellUser = { name: string; email: string; role: Role };

function LogoutButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 disabled:opacity-60"
    >
      {pending ? <Spinner className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
      Cerrar sesión
    </button>
  );
}

export function AdminShell({
  user,
  children,
}: {
  user: ShellUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Solo se muestran las secciones permitidas para el rol (la protección real está en el servidor)
  const items = NAV_ITEMS.filter((item) => canAccess(user.role, item.section));

  const sidebarContent = (
    <>
      <div className="px-5 py-5 text-lg font-semibold">Menú Digital</div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {items.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                active
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
              <div className="px-3 pb-3">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100"
        >
          <ExternalLink className="h-4 w-4" />
          Ver menú
        </Link>
      </div>
      <div className="border-t border-neutral-200 p-3">
        <div className="px-3 pb-2">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-neutral-500">
            {user.role === "ADMIN" ? "Administrador" : "Usuario"} · {user.email}
          </p>
        </div>
        <form action={logoutAction}>
          <LogoutButton />
        </form>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 lg:flex">
      {/* Barra lateral en pantallas grandes */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-neutral-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen">
        {sidebarContent}
      </aside>

      {/* Barra superior en teléfono */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="Abrir menú" className="p-1">
          <Menu className="h-6 w-6" />
        </button>
        <span className="font-semibold">Menú Digital</span>
        <span className="w-8" />
      </header>

      {/* Menú desplegable en teléfono */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-white shadow-xl">
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
              className="absolute right-3 top-4 p-1"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      <main className="min-w-0 flex-1 p-4 sm:p-8">{children}</main>
    </div>
  );
}