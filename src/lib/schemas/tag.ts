//src/lib/schemas/tag.ts
import { z } from "zod";

const name = z
  .string()
  .trim()
  .min(2, "El nombre debe tener al menos 2 caracteres")
  .max(40, "El nombre no puede superar 40 caracteres");

// Ícono emoji opcional; texto vacío se guarda como null
const icon = z
  .string()
  .trim()
  .max(8, "El ícono es demasiado largo")
  .optional()
  .transform((v) => (v ? v : null));

const id = z.string().min(1);

export const createTagSchema = z.object({ name, icon });
export const updateTagSchema = z.object({ id, name, icon });
export const tagIdSchema = z.object({ id });
export const moveTagSchema = z.object({ id, direction: z.enum(["up", "down"]) });