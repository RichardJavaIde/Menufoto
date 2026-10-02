//src/lib/schemas/image.ts
import { z } from "zod";

// Recorte en porcentaje (0-100) sobre la imagen base
export const cropSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(1).max(100),
  height: z.number().min(1).max(100),
});

export type Crop = z.infer<typeof cropSchema>;