//src/lib/schemas/settings.ts
import { z } from "zod";
import { socialUrl, webUrl } from "@/lib/links";

// Texto opcional: vacío se guarda como null
const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((v) => (v ? v : null));

const PHONE_RE = /^[\d\s+().-]{7,30}$/;
const PHONE_ERROR = "Teléfono inválido: usa solo números, espacios, + y guiones (mínimo 7 dígitos)";

const imageId = z.string().min(1).nullable();

export const identitySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(80, "El nombre no puede superar 80 caracteres"),
  tagline: optionalText(120, "El eslogan no puede superar 120 caracteres"),
  description: optionalText(400, "La descripción no puede superar 400 caracteres"),
  logoId: imageId,
  coverId: imageId,
});

export const contactSchema = z.object({
  address: optionalText(160, "La dirección no puede superar 160 caracteres"),
  phone: optionalText(30, PHONE_ERROR).refine((v) => v === null || PHONE_RE.test(v), PHONE_ERROR),
  whatsapp: optionalText(30, PHONE_ERROR).refine((v) => v === null || PHONE_RE.test(v), PHONE_ERROR),
  email: optionalText(120, "El correo es demasiado largo").refine(
    (v) => v === null || z.string().email().safeParse(v).success,
    "Correo inválido"
  ),
  instagram: optionalText(100, "El Instagram es demasiado largo").refine(
    (v) => v === null || socialUrl("https://instagram.com/", v) !== null,
    "Instagram inválido: escribe @usuario o el enlace"
  ),
  facebook: optionalText(120, "El Facebook es demasiado largo").refine(
    (v) => v === null || socialUrl("https://facebook.com/", v) !== null,
    "Facebook inválido: escribe el usuario o el enlace"
  ),
  website: optionalText(200, "El sitio web es demasiado largo").refine(
    (v) => v === null || webUrl(v) !== null,
    "Sitio web inválido"
  ),
});

export const currencySchema = z.object({
  currencySymbol: z
    .string()
    .trim()
    .min(1, "Escribe el símbolo de la moneda")
    .max(6, "El símbolo es demasiado largo"),
  currencyCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{3}$/, "El código debe tener 3 letras (por ejemplo DOP)")
    .transform((v) => v.toUpperCase()),
});

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida");

const dayHours = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    closed: z.boolean(),
    opensAt: time.nullable(),
    closesAt: time.nullable(),
  })
  .superRefine((d, ctx) => {
    if (!d.closed && (!d.opensAt || !d.closesAt)) {
      ctx.addIssue({
        code: "custom",
        message: "Indica la hora de apertura y de cierre de los días abiertos",
      });
    }
  });

export const hoursSchema = z
  .object({ hours: z.array(dayHours).length(7, "Faltan días del horario") })
  .refine((v) => new Set(v.hours.map((h) => h.dayOfWeek)).size === 7, "Hay días repetidos");