//src/lib/schemas/font-options.ts
export const FONT_OPTIONS = {
  playfair: { label: "Playfair Display", kind: "Serif elegante", stack: "var(--font-playfair), Georgia, serif" },
  cormorant: { label: "Cormorant Garamond", kind: "Serif clásica", stack: "var(--font-cormorant), Georgia, serif" },
  dmserif: { label: "DM Serif Display", kind: "Serif de titular", stack: "var(--font-dmserif), Georgia, serif" },
  lora: { label: "Lora", kind: "Serif de lectura", stack: "var(--font-lora), Georgia, serif" },
  baskerville: { label: "Libre Baskerville", kind: "Serif tradicional", stack: "var(--font-baskerville), Georgia, serif" },
  abril: { label: "Abril Fatface", kind: "Titular de revista", stack: "var(--font-abril), Georgia, serif" },
  amatic: { label: "Amatic SC", kind: "Manuscrita rústica", stack: "var(--font-amatic), cursive" },
  inter: { label: "Inter", kind: "Sans moderna", stack: "var(--font-inter), system-ui, sans-serif" },
  montserrat: { label: "Montserrat", kind: "Sans geométrica", stack: "var(--font-montserrat), system-ui, sans-serif" },
  poppins: { label: "Poppins", kind: "Sans redondeada", stack: "var(--font-poppins), system-ui, sans-serif" },
  worksans: { label: "Work Sans", kind: "Sans editorial", stack: "var(--font-worksans), system-ui, sans-serif" },
  oswald: { label: "Oswald", kind: "Sans condensada", stack: "var(--font-oswald), Impact, sans-serif" },
} as const;

export type FontKey = keyof typeof FONT_OPTIONS;

export const FONT_KEYS = Object.keys(FONT_OPTIONS) as [FontKey, ...FontKey[]];

export function isFontKey(value: unknown): value is FontKey {
  return typeof value === "string" && value in FONT_OPTIONS;
}