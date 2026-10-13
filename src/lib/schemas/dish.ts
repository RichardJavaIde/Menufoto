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

// Precio en oferta: vacío = sin oferta
const offerPrice = z
  .string()
  .trim()
  .optional()
  .transform((v, ctx) => {
    if (!v) return null;
    const n = v.replace(",", ".");
    if (!/^\d+(\.\d{1,2})?$/.test(n)) {
      ctx.addIssue({
        code: "custom",
        message: "Precio en oferta inválido: usa números, con hasta 2 decimales",
      });
      return z.NEVER;
    }
    const cents = Math.round(parseFloat(n) * 100);
    if (cents <= 0 || cents > 99_999_999) {
      ctx.addIssue({ code: "custom", message: "El precio en oferta no es válido" });
      return z.NEVER;
    }
    return cents;
  });

// Fecha de calendario YYYY-MM-DD; vacío = null
const dateField = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), "Fecha inválida");

const categoryId = z.string().min(1, "Selecciona una categoría");
const tagIds = z.array(z.string().min(1)).max(30);
const imageId = z.string().min(1).nullable();
const id = z.string().min(1);

const fields = {
  name,
  description,
  price,
  categoryId,
  tagIds,
  imageId,
  visible: z.boolean(),
  available: z.boolean(),
  popular: z.boolean(),
  offerPrice,
  offerStart: dateField,
  offerEnd: dateField,
};

type OfferData = {
  price: number;
  offerPrice: number | null;
  offerStart: string | null;
  offerEnd: string | null;
};

function checkOffer(d: OfferData, ctx: z.RefinementCtx) {
  if (d.offerPrice !== null && d.offerPrice >= d.price) {
    ctx.addIssue({
      code: "custom",
      path: ["offerPrice"],
      message: "El precio en oferta debe ser menor al precio normal",
    });
  }
  if (d.offerPrice === null && (d.offerStart || d.offerEnd)) {
    ctx.addIssue({
      code: "custom",
      path: ["offerPrice"],
      message: "Escribe el precio en oferta o quita las fechas",
    });
  }
  if (d.offerStart && d.offerEnd && d.offerEnd < d.offerStart) {
    ctx.addIssue({
      code: "custom",
      path: ["offerEnd"],
      message: "La fecha final no puede ser anterior a la inicial",
    });
  }
}

export const createDishSchema = z.object(fields).superRefine(checkOffer);
export const updateDishSchema = z.object({ id, ...fields }).superRefine(checkOffer);

export const dishIdSchema = z.object({ id });
export const toggleDishFlagSchema = z.object({
  id,
  field: z.enum(["visible", "available"]),
});
export const moveDishSchema = z.object({ id, direction: z.enum(["up", "down"]) });