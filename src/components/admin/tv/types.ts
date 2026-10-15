//src/components/admin/tv/types.ts
export type ScreenRow = {
  id: string;
  name: string;
  link: string; // parte final de la dirección: /tv/<link>
  url: string; // dirección completa
  active: boolean;
  slideCount: number;
  lastSeen: string | null; // ya formateado en la zona del restaurante
  online: boolean; // se conectó en los últimos 3 minutos
};