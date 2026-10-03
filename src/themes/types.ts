//src/themes/types.ts
import type { FontKey } from "./font-options";

export const THEME_IDS = ["elegante", "moderno", "rustico", "premium", "editorial"] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export type ThemeColors = {
  background: string;
  surface: string;
  text: string;
  muted: string;
  primary: string;
  accent: string;
  border: string;
};

export type HeadingStyle = "centered" | "left-line" | "banner" | "numbered" | "editorial";
export type DishLayout = "centered" | "card" | "leader" | "overlay" | "magazine";
export type DividerStyle = "none" | "line" | "double" | "dots" | "ornament";
export type PriceStyle = "plain" | "pill" | "outline" | "accent";
export type TagStyle = "pill" | "outline" | "square" | "text";
export type ImageShape = "rounded" | "square" | "circle" | "arch";
export type ImageAspect = "4/3" | "1/1" | "3/2" | "16/9" | "3/4";
export type Spacing = "compact" | "normal" | "airy";
export type Texture = "none" | "paper" | "grain" | "linen";
export type Radius = "none" | "sm" | "md" | "lg" | "xl";

export type Theme = {
  id: ThemeId;
  name: string;
  description: string;
  colors: ThemeColors;
  fonts: { heading: FontKey; body: FontKey };
  heading: HeadingStyle;
  dish: DishLayout;
  divider: DividerStyle;
  price: PriceStyle;
  tag: TagStyle;
  image: { aspect: ImageAspect; shape: ImageShape };
  spacing: Spacing;
  texture: Texture;
  radius: Radius;
};