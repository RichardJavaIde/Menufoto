//src/app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-5xl font-semibold text-neutral-300">404</p>
      <h1 className="text-xl font-semibold">Esta página no existe</h1>
      <Link
        href="/"
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
      >
        Ir al menú
      </Link>
    </main>
  );
}