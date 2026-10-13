//src/lib/schemas/tv.ts
import { z } from "zod";

const id = z.string().min(1);

const name = z
  .string()
  .trim()
  .min(2, "El nombre debe tener al menos 2 caracteres")
  .max(60, "El nombre no puede superar 60 caracteres");

export const createScreenSchema = z.object({
  name,
  preset: z.enum(["PROMO", "MENU", "EMPTY"]),
});

export const updateScreenSchema = z.object({ id, name });

export const screenIdSchema = z.object({ id });