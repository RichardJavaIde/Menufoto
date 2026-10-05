//src/app/login/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mediaUrl } from "@/lib/media";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/admin");

  // Si la base no responde, el login sigue funcionando sin logo
  const settings = await prisma.restaurantSettings
    .findUnique({
      where: { id: 1 },
      select: { name: true, logo: { select: { fileKey: true } } },
    })
    .catch(() => null);

  const name = settings?.name ?? "Panel de administración";
  const logoUrl = settings?.logo ? mediaUrl(settings.logo.fileKey, 480) : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <div className="mb-6 flex flex-col items-center text-center">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={`Logo de ${name}`}
              className="mb-3 h-20 w-auto max-w-[200px] object-contain"
            />
          )}
          <h1 className="text-xl font-semibold">{name}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Panel de administración · Inicia sesión para continuar
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}