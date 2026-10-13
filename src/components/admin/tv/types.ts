//src/components/admin/tv/types.ts
export type ScreenRow = {
  id: string;
  name: string;
  url: string; // enlace completo /tv/<token>
  active: boolean;
  slideCount: number;
  lastSeen: string | null; // ya formateado en la zona del restaurante
};