//src/lib/schemas/tv-slide.ts
import { z } from "zod";

const id = z.string().min(1);

const time = z.union([z.literal(""), z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida")]);

export const createSlideSchema = z
  .object({
    screenId: id,
    type: z.enum(["OFFERS", "POPULAR", "CATEGORY"]),
    categoryId: z.string().nullable(),
  })
  .superRefine((d, ctx) => {
    if (d.type === "CATEGORY" && !d.categoryId) {
      ctx.addIssue({ code: "custom", path: ["categoryId"], message: "Selecciona una categoría" });
    }
  });

export const updateSlideSchema = z
  .object({
    id,
    seconds: z
      .number()
      .int("Los segundos deben ser un número entero")
      .min(3, "Mínimo 3 segundos")
      .max(120, "Máximo 120 segundos"),
    effect: z.enum(["FADE", "SLIDE", "ZOOM", "KENBURNS"]),
    active: z.boolean(),
    days: z.array(z.number().int().min(0).max(6)).max(7),
    start: time,
    end: time,
    categoryId: z.string().nullable(),
  })
  .superRefine((d, ctx) => {
    if ((d.start === "") !== (d.end === "")) {
      ctx.addIssue({
        code: "custom",
        path: ["end"],
        message: "Indica la hora de inicio y la de fin, o deja ambas vacías",
      });
    } else if (d.start !== "" && d.start === d.end) {
      ctx.addIssue({
        code: "custom",
        path: ["end"],
        message: "La hora de fin debe ser distinta de la de inicio",
      });
    }
  });

export const slideIdSchema = z.object({ id });
export const moveSlideSchema = z.object({ id, direction: z.enum(["up", "down"]) });