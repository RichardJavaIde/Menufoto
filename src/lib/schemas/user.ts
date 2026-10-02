//src/lib/schemas/user.ts
import { z } from "zod";

export const roleSchema = z.enum(["ADMIN", "USER"]);

const name = z
  .string()
  .trim()
  .min(2, "El nombre debe tener al menos 2 caracteres")
  .max(80, "El nombre es demasiado largo");

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Escribe un correo válido")
  .max(120, "El correo es demasiado largo");

const password = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(72, "La contraseña es demasiado larga");

const id = z.string().min(1);

export const createUserSchema = z.object({ name, email, password, role: roleSchema });
export const updateUserSchema = z.object({ id, name, email, role: roleSchema });
export const changePasswordSchema = z.object({ id, password });
export const userIdSchema = z.object({ id });