//// Dirección pública del sitio. Se lee al ejecutar, así una imagen sirve para todos los clientes.
export function siteUrl() {
  return (process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
