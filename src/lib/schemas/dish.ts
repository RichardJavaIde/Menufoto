//src/lib/schemas/dish.ts
import { z } from "zod";

const name = z
  .string()
  .trim()
  .min(2, "El nombre debe tener al menos 2 caracteres")
  .max(80, "El nombre no puede superar 80 caracteres");

const description = z
  .string()
  .trim()
  .max(400, "La descripción no puede superar 400 caracteres")
  .optional()
  .transform((v) => (v ? v : null));

// El usuario escribe "350" o "350.50"; se guarda en centavos
const price = z
  .string()
  .trim()
  .min(1, "Escribe el precio")
  .transform((v) => v.replace(",", "."))
  .refine((v) => /^\d+(\.\d{1,2})?$/.test(v), "Precio inválido: usa números, con hasta 2 decimales")
  .transform((v) => Math.round(parseFloat(v) * 100))
  .refine((cents) => cents <= 99_999_999, "El precio es demasiado alto");

const categoryId = z.string().min(1, "Selecciona una categoría");
const tagIds = z.array(z.string().min(1)).max(30);
const imageId = z.string().min(1).nullable();
const id = z.string().min(1);

export const createDishSchema = z.object({
  name,
  description,
  price,
  categoryId,
  tagIds,
  imageId,
  visible: z.boolean(),
  available: z.boolean(),
});

export const updateDishSchema = z.object({
  id,
  name,
  description,
  price,
  categoryId,
  tagIds,
  imageId,
  visible: z.boolean(),
  available: z.boolean(),
});

export const dishIdSchema = z.object({ id });
export const toggleDishFlagSchema = z.object({
  id,
  field: z.enum(["visible", "available"]),
});
export const moveDishSchema = z.object({ id, direction: z.enum(["up", "down"]) });