//src/components/admin/settings/settings-card.tsx
import { Spinner } from "@/components/ui/spinner";
import { primaryButton } from "@/components/ui/styles";

export function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl bg-white p-5 ring-1 ring-neutral-200 sm:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function SaveButton({ pending, dirty }: { pending: boolean; dirty: boolean }) {
  return (
    <div className="flex items-center justify-end gap-3 pt-2">
      {dirty && !pending && <span className="text-xs text-amber-700">Cambios sin guardar</span>}
      <button type="submit" disabled={!dirty || pending} className={primaryButton}>
        {pending && <Spinner className="h-4 w-4" />}
        Guardar
      </button>
    </div>
  );
}