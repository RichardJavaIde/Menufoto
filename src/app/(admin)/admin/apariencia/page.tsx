import { requireSection } from "@/lib/auth";

export default async function Page() {
  await requireSection("apariencia");
  return (
    <div>
      <h1 className="text-2xl font-semibold">Apariencia</h1>
      <p className="mt-2 text-neutral-500">Próximamente.</p>
    </div>
  );
}
