//src/lib/schemas/appearance.ts
import { z } from "zod";
import { THEME_IDS } from "@/themes/types";
import { FONT_KEYS } from "@/themes/font-options";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color inválido").nullable();
const font = z.enum(FONT_KEYS).nullable();

export const appearanceSchema = z.object({
  themeId: z.enum(THEME_IDS),
  colorPrimary: hexColor,
  colorAccent: hexColor,
  colorBackground: hexColor,
  colorText: hexColor,
  fontHeading: font,
  fontBody: font,
});