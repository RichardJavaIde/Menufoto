//src/components/menu/photo-viewer.tsx
"use client";

import { useEffect, useRef, useState } from "react";

type Photo = { src: string; name: string; price: string; description: string };

// Se monta una sola vez en el menú. Escucha los toques en cualquier foto con data-zoom-src.
export function PhotoViewer() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    function open(el: HTMLElement) {
      setLoaded(false);
      setPhoto({
        src: el.dataset.zoomSrc ?? "",
        name: el.dataset.zoomName ?? "",
        price: el.dataset.zoomPrice ?? "",
        description: el.dataset.zoomDesc ?? "",
      });
    }

    function onClick(e: MouseEvent) {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-zoom-src]");
      if (el) open(el);
    }

    // Con teclado: Enter o espacio sobre la foto enfocada
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Enter" && e.key !== " ") return;
      const el = e.target as HTMLElement;
      if (el.matches?.("[data-zoom-src]")) {
        e.preventDefault();
        open(el);
      }
    }

    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (photo && dialog && !dialog.open) dialog.showModal();
  }, [photo]);

  return (
    <dialog
      ref={dialogRef}
      className="mt-zoom"
      aria-label={photo ? `Foto de ${photo.name}` : "Foto del plato"}
      onClose={() => setPhoto(null)}
      // Un toque en el fondo (fuera de la foto) cierra el visor
      onClick={(e) => {
        if (e.target === e.currentTarget) dialogRef.current?.close();
      }}
    >
      {photo && (
        <figure className="mt-zoom-box" data-loaded={loaded ? "" : undefined}>
          <button
            type="button"
            className="mt-zoom-close"
            aria-label="Cerrar foto"
            onClick={() => dialogRef.current?.close()}
          >
            ×
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={(el) => {
              if (el?.complete) setLoaded(true);
            }}
            className="mt-zoom-img"
            src={photo.src}
            alt={photo.name}
            decoding="async"
            onLoad={() => setLoaded(true)}
          />

          <figcaption className="mt-zoom-cap">
            <span className="mt-zoom-name">{photo.name}</span>
            <span className="mt-zoom-price">{photo.price}</span>
            {photo.description && <p className="mt-zoom-desc">{photo.description}</p>}
          </figcaption>
        </figure>
      )}
    </dialog>
  );
}