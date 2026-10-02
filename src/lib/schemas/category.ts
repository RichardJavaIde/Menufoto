//src/lib/schemas/category.ts
import { z } from "zod";

const name = z
  .string()
  .trim()
  .min(2, "El nombre debe tener al menos 2 caracteres")
  .max(60, "El nombre no puede superar 60 caracteres");

// Texto vacío se guarda como null
const description = z
  .string()
  .trim()
  .max(200, "La descripción no puede superar 200 caracteres")
  .optional()
  .transform((v) => (v ? v : null));

const id = z.string().min(1);

export const createCategorySchema = z.object({
  name,
  description,
  active: z.boolean(),
});

export const updateCategorySchema = z.object({
  id,
  name,
  description,
  active: z.boolean(),
});

export const categoryIdSchema = z.object({ id });

export const moveCategorySchema = z.object({
  id,
  direction: z.enum(["up", "down"]),
});