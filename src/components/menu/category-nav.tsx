//src/components/menu/category-nav.tsx
"use client";

import { useEffect, useRef, useState } from "react";

export function CategoryNav({ items }: { items: { id: string; name: string }[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  const listRef = useRef<HTMLUListElement>(null);

  // Detecta qué categoría está en pantalla
  useEffect(() => {
    const sections = items
      .map((i) => document.getElementById(`cat-${i.id}`))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id.replace("cat-", ""));
      },
      { rootMargin: "-72px 0px -60% 0px" }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [items]);

  // Mantiene visible el botón activo dentro de la barra
  useEffect(() => {
    const list = listRef.current;
    const chip = list?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (!list || !chip) return;
    list.scrollTo({
      left: chip.offsetLeft - list.clientWidth / 2 + chip.clientWidth / 2,
      behavior: "smooth",
    });
  }, [active]);

  return (
    <nav className="mt-nav" aria-label="Categorías">
      <ul ref={listRef} className="mt-nav-list">
        {items.map((i) => (
          <li key={i.id}>
            <a
              href={`#cat-${i.id}`}
              data-id={i.id}
              aria-current={active === i.id ? "true" : undefined}
              className="mt-nav-chip"
            >
              {i.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}