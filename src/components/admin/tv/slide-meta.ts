//src/components/admin/tv/slide-meta.ts
export type SlideType = "OFFERS" | "POPULAR" | "CATEGORY" | "GALLERY";
export type SlideEffect = "FADE" | "SLIDE" | "ZOOM" | "KENBURNS";
export type GalleryMode = "SINGLE" | "SPLIT" | "SEQUENCE";

export type GalleryImage = { id: string; key: string };

export type SlideRow = {
  id: string;
  type: SlideType;
  seconds: number;
  effect: SlideEffect;
  active: boolean;
  days: number | null;
  startMinute: number | null;
  endMinute: number | null;
  categoryId: string | null;
  categoryName: string | null;
  galleryMode: GalleryMode;
  images: GalleryImage[];
};

export type CategoryOption = { id: string; name: string };

export const TYPE_INFO: Record<SlideType, { label: string; hint: string }> = {
  OFFERS: { label: "Ofertas", hint: "Platos con un precio en oferta vigente." },
  POPULAR: { label: "Los más pedidos", hint: "Platos marcados como populares." },
  CATEGORY: { label: "Categoría", hint: "Los platos de una categoría del menú." },
  GALLERY: { label: "Galería de imágenes", hint: "Flyers o fotos para eventos y promociones." },
};

export const GALLERY_MODES: { value: GalleryMode; label: string; hint: string }[] = [
  { value: "SINGLE", label: "Una imagen", hint: "Ocupa toda la pantalla." },
  { value: "SPLIT", label: "Dos lado a lado", hint: "Dos imágenes al mismo tiempo." },
  { value: "SEQUENCE", label: "Secuencia", hint: "Hasta 4 imágenes, una tras otra." },
];

export const MODE_LABEL: Record<GalleryMode, string> = {
  SINGLE: "Una imagen",
  SPLIT: "Dos lado a lado",
  SEQUENCE: "Secuencia",
};

export const EFFECTS: { value: SlideEffect; label: string }[] = [
  { value: "FADE", label: "Desvanecer" },
  { value: "SLIDE", label: "Deslizar" },
  { value: "ZOOM", label: "Zoom" },
  { value: "KENBURNS", label: "Ken Burns (zoom lento en las fotos)" },
];

export const EFFECT_LABEL: Record<SlideEffect, string> = {
  FADE: "Desvanecer",
  SLIDE: "Deslizar",
  ZOOM: "Zoom",
  KENBURNS: "Ken Burns",
};

export const DAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // empieza en lunes

export function minutesToTime(minutes: number | null) {
  if (minutes === null) return "";
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

export function daysFromMask(mask: number | null): number[] {
  if (mask === null) return [];
  return [0, 1, 2, 3, 4, 5, 6].filter((d) => (mask & (1 << d)) !== 0);
}

export function scheduleSummary(
  days: number | null,
  startMinute: number | null,
  endMinute: number | null
) {
  const parts: string[] = [];
  const list = daysFromMask(days);
  if (list.length > 0 && list.length < 7) {
    parts.push(
      DAY_ORDER.filter((d) => list.includes(d))
        .map((d) => DAY_SHORT[d])
        .join(", ")
    );
  }
  if (startMinute !== null && endMinute !== null) {
    parts.push(`${minutesToTime(startMinute)}–${minutesToTime(endMinute)}`);
  }
  return parts.length > 0 ? parts.join(" · ") : "Siempre";
}