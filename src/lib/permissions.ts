//src/lib/permissions.ts
export type Role = "ADMIN" | "USER";

export type Section =
  | "dashboard"
  | "categorias"
  | "platos"
  | "etiquetas"
  | "apariencia"
  | "qr"
  | "configuracion"
  | "usuarios";

// Único lugar donde se define quién entra a cada sección
const ACCESS: Record<Section, Role[]> = {
  dashboard: ["ADMIN", "USER"],
  categorias: ["ADMIN", "USER"],
  platos: ["ADMIN", "USER"],
  etiquetas: ["ADMIN", "USER"],
  qr: ["ADMIN", "USER"],
  apariencia: ["ADMIN"],
  configuracion: ["ADMIN"],
  usuarios: ["ADMIN"],
};

export function canAccess(role: Role, section: Section): boolean {
  return ACCESS[section].includes(role);
}