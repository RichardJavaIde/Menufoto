//src/app/login/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/admin");

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <h1 className="text-xl font-semibold">Panel de administración</h1>
        <p className="mb-6 mt-1 text-sm text-neutral-500">Inicia sesión para continuar</p>
        <LoginForm />
      </div>
    </main>
  );
}