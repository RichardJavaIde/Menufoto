//src/themes/resolve.ts
import type { CSSProperties } from "react";
import { HEX_RE, readableOn } from "@/lib/color";
import { FONT_OPTIONS, isFontKey, type FontKey } from "./font-options";
import { getTheme } from "./definitions";
import type { ImageShape, Radius, Spacing, Texture, Theme, ThemeColors } from "./types";

// Lo que se guarda en los ajustes del restaurante
export type Appearance = {
  themeId: string;
  colorPrimary: string | null;
  colorAccent: string | null;
  colorBackground: string | null;
  colorText: string | null;
  fontHeading: string | null;
  fontBody: string | null;
};

export type ResolvedTheme = {
  theme: Theme;
  colors: ThemeColors;
  fonts: { heading: FontKey; body: FontKey };
  style: CSSProperties;
  attrs: { heading: string; dish: string; divider: string; price: string; tag: string };
};

const RADIUS: Record<Radius, string> = {
  none: "0",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.9rem",
  xl: "1.4rem",
};

const IMAGE_RADIUS: Record<ImageShape, string> = {
  rounded: "var(--m-radius)",
  square: "0",
  circle: "9999px",
  arch: "9999px 9999px 0.4rem 0.4rem",
};

const SPACING: Record<Spacing, { gap: string; section: string }> = {
  compact: { gap: "1rem", section: "2.5rem" },
  normal: { gap: "1.5rem", section: "3.5rem" },
  airy: { gap: "2.1rem", section: "4.75rem" },
};

function noise(frequency: number, opacity: number) {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>` +
    `<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='${frequency}' numOctaves='3' stitchTiles='stitch'/>` +
    `<feColorMatrix type='saturate' values='0'/></filter>` +
    `<rect width='100%' height='100%' filter='url(#n)' opacity='${opacity}'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const TEXTURES: Record<Texture, string> = {
  none: "none",
  paper: noise(0.05, 0.07),
  grain: noise(0.9, 0.09),
  linen:
    "repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0 1px, transparent 1px 3px), " +
    "repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0 1px, transparent 1px 3px)",
};

// Solo se aceptan colores hexadecimales válidos (los valores terminan en un atributo style)
const hex = (v: string | null) => (v && HEX_RE.test(v) ? v.toLowerCase() : null);

export function resolveTheme(appearance: Appearance): ResolvedTheme {
  const theme = getTheme(appearance.themeId);

  const background = hex(appearance.colorBackground);
  const text = hex(appearance.colorText);

  const bg = background ?? theme.colors.background;
  const fg = text ?? theme.colors.text;
  const customBase = Boolean(background || text);

  // Si el admin cambia fondo o texto, los tonos derivados se recalculan para mantener el contraste
  const colors: ThemeColors = {
    background: bg,
    text: fg,
    primary: hex(appearance.colorPrimary) ?? theme.colors.primary,
    accent: hex(appearance.colorAccent) ?? theme.colors.accent,
    surface: background ? `color-mix(in srgb, ${bg} 92%, ${fg})` : theme.colors.surface,
    muted: customBase ? `color-mix(in srgb, ${fg} 62%, ${bg})` : theme.colors.muted,
    border: customBase ? `color-mix(in srgb, ${fg} 16%, ${bg})` : theme.colors.border,
  };

  const fonts = {
    heading: isFontKey(appearance.fontHeading) ? appearance.fontHeading : theme.fonts.heading,
    body: isFontKey(appearance.fontBody) ? appearance.fontBody : theme.fonts.body,
  };

  const spacing = SPACING[theme.spacing];
  const aspect = theme.image.shape === "circle" ? "1 / 1" : theme.image.aspect.replace("/", " / ");

  const style = {
    "--m-bg": colors.background,
    "--m-surface": colors.surface,
    "--m-text": colors.text,
    "--m-muted": colors.muted,
    "--m-primary": colors.primary,
    "--m-accent": colors.accent,
    "--m-border": colors.border,
    "--m-on-primary": readableOn(colors.primary),
    "--m-font-heading": FONT_OPTIONS[fonts.heading].stack,
    "--m-font-body": FONT_OPTIONS[fonts.body].stack,
    "--m-radius": RADIUS[theme.radius],
    "--m-img-radius": IMAGE_RADIUS[theme.image.shape],
    "--m-img-aspect": aspect,
    "--m-gap": spacing.gap,
    "--m-section": spacing.section,
    "--m-texture": TEXTURES[theme.texture],
  } as CSSProperties;

  return {
    theme,
    colors,
    fonts,
    style,
    attrs: {
      heading: theme.heading,
      dish: theme.dish,
      divider: theme.divider,
      price: theme.price,
      tag: theme.tag,
    },
  };
}