//src/lib/schemas/tv.ts
import { z } from "zod";

const id = z.string().min(1);

const name = z
  .string()
  .trim()
  .min(2, "El nombre debe tener al menos 2 caracteres")
  .max(60, "El nombre no puede superar 60 caracteres");

// Parte final de la dirección: /tv/<enlace>
const link = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Escribe el enlace")
  .max(40, "El enlace no puede superar 40 caracteres")
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "El enlace solo puede tener letras, números y guiones, sin espacios"
  );

export const createScreenSchema = z.object({
  name,
  // Vacío = se asigna solo (1, 2, 3…)
  link: z.union([z.literal(""), link]),
  preset: z.enum(["PROMO", "MENU", "EMPTY"]),
});

export const updateScreenSchema = z.object({ id, name, link });

export const screenIdSchema = z.object({ id });