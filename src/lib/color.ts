//src/lib/color.ts
export const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function channel(value: number) {
  const s = value / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

// Relación de contraste WCAG entre dos colores hexadecimales (1 a 21)
export function contrastRatio(a: string, b: string) {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// Color de texto (blanco o casi negro) que se lee mejor sobre el color dado
export function readableOn(hex: string) {
  return contrastRatio(hex, "#ffffff") >= contrastRatio(hex, "#111111") ? "#ffffff" : "#111111";
}