//src/components/menu/category-nav.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { matchesQuery, normalizeText } from "@/lib/search";

type Item = { id: string; name: string };

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function CategoryNav({ items }: { items: Item[] }) {
  const hasChips = items.length > 1;
  // Con una sola categoría no hay botones, así que el campo de búsqueda se muestra siempre
  const alwaysSearch = !hasChips;

  const [active, setActive] = useState(items[0]?.id ?? "");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const wasSearching = useRef(false);

  const showField = searchOpen || alwaysSearch;

  // Detecta qué categoría está en pantalla
  useEffect(() => {
    if (!hasChips || showField) return;

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
  }, [items, hasChips, showField]);

  // Mantiene visible el botón activo dentro de la barra
  useEffect(() => {
    const list = listRef.current;
    const chip = list?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (!list || !chip) return;
    list.scrollTo({
      left: chip.offsetLeft - list.clientWidth / 2 + chip.clientWidth / 2,
      behavior: "smooth",
    });
  }, [active, showField]);

  // Enfoca el campo al abrir la búsqueda
  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  // Filtra los platos que ya están en la página (sin volver a dibujarla)
  useEffect(() => {
    const menu = document.querySelector<HTMLElement>(".mt-menu");
    if (!menu) return;

    const dishes = menu.querySelectorAll<HTMLElement>(".mt-dish[data-search]");
    const sections = menu.querySelectorAll<HTMLElement>(".mt-section");
    const empty = document.getElementById("mt-no-results");
    const searching = normalizeText(query) !== "";

    let count = 0;
    dishes.forEach((dish) => {
      const show = !searching || matchesQuery(dish.dataset.search ?? "", query);
      dish.hidden = !show;
      if (show) count++;
    });
    sections.forEach((section) => {
      section.hidden = searching && !section.querySelector(".mt-dish:not([hidden])");
    });
    menu.toggleAttribute("data-searching", searching);

    if (empty) {
      const none = searching && count === 0;
      empty.hidden = !none;
      if (none) empty.textContent = `No encontramos platos para “${query.trim()}”.`;
    }

    if (statusRef.current) {
      statusRef.current.textContent = !searching
        ? ""
        : count === 0
          ? "Sin resultados"
          : `${count} ${count === 1 ? "plato encontrado" : "platos encontrados"}`;
    }

    // Si el cliente había bajado en la página, sube a los resultados
    if (searching && !wasSearching.current) {
      const main = document.querySelector<HTMLElement>("main.mt-container");
      if (main && main.getBoundingClientRect().top < 0) main.scrollIntoView({ block: "start" });
    }
    wasSearching.current = searching;
  }, [query]);

  function closeSearch() {
    setQuery("");
    setSearchOpen(false);
  }

  return (
    <nav className="mt-nav" aria-label="Categorías y búsqueda">
      <div className="mt-nav-bar">
        {showField ? (
          <>
            <form role="search" className="mt-search" onSubmit={(e) => e.preventDefault()}>
              <label className="mt-search-field">
                <SearchIcon />
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      if (alwaysSearch) setQuery("");
                      else closeSearch();
                    }
                  }}
                  placeholder="Buscar en el menú…"
                  aria-label="Buscar en el menú"
                  autoComplete="off"
                  enterKeyHint="search"
                  className="mt-search-input"
                />
              </label>
            </form>
            {!alwaysSearch && (
              <button type="button" onClick={closeSearch} className="mt-icon-btn" aria-label="Cerrar búsqueda">
                <CloseIcon />
              </button>
            )}
          </>
        ) : (
          <>
            {/* El espacio de la izquierda iguala al botón de la derecha para que las categorías queden centradas */}
            <span className="mt-nav-spacer" aria-hidden />
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
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="mt-icon-btn"
              aria-label="Buscar en el menú"
            >
              <SearchIcon />
            </button>
          </>
        )}
      </div>
      <p ref={statusRef} className="sr-only" aria-live="polite" />
    </nav>
  );
}