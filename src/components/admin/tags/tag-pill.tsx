//src/components/admin/tags/tag-pill.tsx
export function TagPill({ name, icon }: { name: string; icon?: string | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-800">
      {icon && <span aria-hidden>{icon}</span>}
      {name}
    </span>
  );
}