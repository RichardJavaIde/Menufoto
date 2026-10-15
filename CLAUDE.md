# CLAUDE.md — Menú Digital Visual

Memoria del proyecto para quien lo modifique (personas o Claude Code). Léelo completo antes de tocar código. Idioma de trabajo: español.

## 1. Qué es

Aplicación web de **menú digital visual para un restaurante** (una instalación = un restaurante), con panel de administración, 5 temas visuales, pipeline de fotos y **Modo TV** (cartelería digital para televisores). Se comercializa: cada cliente tiene su propia instancia (BD, variables, volumen de fotos) corriendo la **misma imagen Docker**.

Stack: Next.js 16 (App Router) + TypeScript + Prisma 6 + PostgreSQL. Fotos con `sharp` (WebP + recorte). Validación con `zod`.

## 2. Despliegue y operación (importante antes de cambiar nada)

- Un VPS OVH (Ubuntu 24.04) con **Coolify v4** y Postgres 18; dominio en Cloudflare.
- Una sola imagen: `ghcr.io/richardjavaide/menufoto`, construida por **GitHub Actions al subir un tag** (`v1.2.0`, etc.).
- Cada cliente es una app Coolify tipo "Docker Image" con: su base de datos, sus variables de entorno y un volumen `<cliente>-uploads` montado en `/data/uploads`.
- Las **migraciones de Prisma se aplican al arrancar el contenedor** (`prisma migrate deploy`). Por eso toda migración debe ser compatible con los datos existentes de todos los clientes.
- Respaldos a Cloudflare R2: `pg_dump` programado en Coolify + script `/usr/local/bin/backup-fotos.sh` (rclone `copy`, cron en `/etc/cron.d/backup-fotos`).
- Clientes: `parquebar` (producción) y un cliente de pruebas.

### Flujo de publicación de una versión
1. `npx tsc --noEmit` y `npm run build` sin errores.
2. Verificar que `.env` **no** aparece en `git status`.
3. Commit, push, crear tag `vX.Y.Z` y subirlo → Actions publica la imagen.
4. Desplegar primero en el **cliente de pruebas** y probar.
5. Hacer respaldo de BD y fotos, y recién entonces actualizar los clientes reales.
- Estado: `v1.1.0` (Modo TV fases 1–2) desplegada. `v1.2.0` (fase 3: latido, wake lock, recarga 6 h; sin migraciones) pendiente de publicar.

## 3. Desarrollo local

- BD de desarrollo: Neon. Migraciones con `npx prisma migrate dev`.
- En Windows: **detener el servidor de desarrollo antes de `npx prisma generate`**; luego reiniciar el servidor TS del editor.
- Rutas con `[ ]` o `( )` en PowerShell: usar `-LiteralPath`.
- Next 16: `params` y `searchParams` son **asíncronos** (`await params`).
- Páginas dinámicas usan `export const dynamic = "force-dynamic"`.
- Mutaciones = **server actions** con validación `zod` (carpeta `src/actions`, esquemas en `src/lib/schemas`). Las APIs públicas son route handlers.

## 4. Roles y permisos

- `src/lib/permissions.ts` define secciones y qué rol accede. Secciones restringidas a **ADMIN**: `tv` y los campos de plato `popular` y oferta.
- La restricción se aplica **en el servidor** (en las actions), no solo ocultando UI. Un usuario USER que edita un plato conserva los valores existentes de esos campos.
- Navegación del panel: `components/admin/nav-items.ts`.

## 5. Mapa de archivos principales

| Área | Archivos |
| --- | --- |
| Modelo de datos | `prisma/schema.prisma` (+ `prisma/migrations`) |
| Zona horaria | `src/lib/tz.ts` (`zonedTimeToUtc`, `utcToZonedDateStr`) |
| Platos y ofertas | `src/lib/schemas/dish.ts`, `src/actions/dishes.ts`, `components/admin/dishes/{types.ts,dish-form.tsx,dishes-manager.tsx}`, `app/(admin)/admin/platos/page.tsx` |
| Pantallas TV (panel) | `src/lib/schemas/tv.ts`, `src/actions/tv.ts`, `components/admin/tv/{types.ts,screen-form.tsx,tv-manager.tsx}`, `app/(admin)/admin/tv/page.tsx` |
| Diapositivas (panel) | `src/lib/schemas/tv-slide.ts`, `src/actions/tv-slides.ts`, `components/admin/tv/{slide-meta.ts,slide-form.tsx,gallery-images.tsx,slides-manager.tsx}`, `app/(admin)/admin/tv/[id]/page.tsx` |
| Reproductor TV | `src/lib/tv-frames.ts`, `src/lib/tv-data.ts`, `components/tv/{tv.css,tv-player.tsx}`, `app/tv/[token]/page.tsx` |
| API del reproductor | `app/api/tv/[token]/route.ts` (GET datos con ETag), `app/api/tv/[token]/ping/route.ts` (POST latido) |
| SEO | `app/robots.ts` (bloquea `/tv`) |
| Imágenes | `/api/images` (subida con recorte), `/media/[file]` (servido con caché inmutable) |

Nota: las rutas de la API deben estar exactamente en `src/app/api/tv/[token]/…`; ya hubo un bug por colocar `route.ts` en otra carpeta ("Enlace no válido").

## 5.1 Modelo de datos del Modo TV

- `TvScreen`: pantalla. El campo `token` es el **enlace corto editable**: se abre en `/tv/<token>`. Al crear, se asigna el menor número libre (`pantalla-1`, `pantalla-2`…). Validación al crear/editar: `^[a-z0-9]+(-[a-z0-9]+)*$`; al leer: `^[A-Za-z0-9_-]{1,64}$`. Duplicado (P2002) → "Ya existe una pantalla con ese enlace". También guarda `active` y `lastSeen`.
- `TvSlide`: tipos `OFFERS | POPULAR | CATEGORY | GALLERY`; efecto `FADE | SLIDE | ZOOM | KENBURNS` (Ken Burns no aplica a galerías); horario con `days` (máscara de bits, 0 = domingo), `startMinute`/`endMinute` (admite cruce de medianoche); `galleryMode` `SINGLE(1) | SPLIT(2) | SEQUENCE(4 máx.)`.
- `TvSlideImage`: imágenes de una galería (relación con `Image`).
- `Dish`: `popular`, `offerPriceCents`, `offerStart`, `offerEnd`. Las fechas de oferta se guardan en UTC a partir de fechas en la zona del restaurante (inicio 00:00:00, fin 23:59:59) usando `RestaurantSettings.timezone`. Si no hay precio de oferta, se envían fechas vacías.
- Galerías: subidas por `/api/images` con recorte completo; se muestran con la variante `-src.webp` (≤ 2000 px), `object-fit: contain` sobre fondo oscuro estirado. Solo imágenes horizontales; sin texto.

## 6. Cómo funciona el reproductor (`/tv/<token>`)

- Lienzo fijo **1920×1080** escalado al viewport. El tema se aplica con `MenuTheme` (variables CSS `--m-*`) dentro de un contenedor `fixed inset-0` (el `container-type` hace que los hijos `fixed` sean relativos al contenedor).
- Los **frames** se construyen en el cliente (`buildFrames`); ofertas y horarios se evalúan con el reloj del servidor (se calcula el desfase respecto al del televisor).
- **Actualización**: al terminar cada vuelta (mínimo 30 s) consulta `/api/tv/<token>` con `If-None-Match` (ETag). 304 = sin cambios. Si cambia el `bootId` (reinicio del servidor/versión) o la apariencia, hace `location.reload()`. Solo muestra aviso de enlace inválido si el JSON trae `status === "missing"`.
- **Fase 3**: latido `POST /ping` cada 60 s (el servidor limita a 1 escritura por 30 s); el panel marca **En línea** si `lastSeen` < 3 min (`ONLINE_MS`) y se refresca cada 30 s; Screen Wake Lock (`navigator.wakeLock`, se vuelve a pedir en `visibilitychange`); recarga completa cada 6 h (solo si la respuesta es OK o 304, para no quedar en pantalla de error si no hay red).
- Resiliencia sin internet: sigue mostrando datos e imágenes ya descargados (imágenes con `Cache-Control: public, max-age=31536000, immutable`).
- Pantalla inactiva: página aparte con `meta refresh` de 60 s. Todas las páginas `/tv` son `noindex`.

## 7. Convenciones al modificar código

1. **Esquema primero**: cambia `schema.prisma`, crea migración con `migrate dev`, y recuerda las relaciones inversas (Prisma da P1012 si falta el lado opuesto: p. ej. `Image.tvSlideImages`, `Category.tvSlides`).
2. Una nueva migración se ejecutará sola en todos los clientes al actualizar: nunca borres columnas con datos sin plan de migración; da valores por defecto.
3. Toda regla de permisos va en el servidor; la UI solo la refleja (`canManageTv`, etc.). Si agregas una prop a un componente, pásala en **todos** sus usos.
4. Validación en `zod` en `src/lib/schemas`; la action devuelve errores legibles en español.
5. Textos de interfaz en **español**.
6. No toques las variables CSS `--m-*` ni los temas sin revisar los 5 temas.
7. Cambios al reproductor TV deben conservar el comportamiento sin conexión y el ETag; probar con el servidor reiniciado (bootId) y con la red cortada.
8. Antes de entregar: `npx tsc --noEmit`, `npm run build`, probar en local y en el cliente de pruebas.
9. Nunca subir `.env` ni credenciales. Nunca publicar directo a un cliente real sin respaldo.

## 8. Pendiente / ideas

- Publicar `v1.2.0` (fase 3).
- Probar en hardware real (Fire TV, Android TV): wake lock (Silk puede no soportarlo), protector de pantalla, recarga de 6 h, comportamiento tras corte de luz. Existe una guía de instalación para clientes (Fire TV y Android TV).
- Retirar la app antigua de Coolify "Public Git" y su volumen; verificar el log del cron de respaldo de fotos; monitoreo opcional.
- A futuro: sistema de facturación/suscripción para el operador (aún sin diseñar).

## 9. Para Claude Code

- Antes de editar, lee `prisma/schema.prisma` y los archivos del mapa de la sección 5 relacionados con tu tarea.
- Cambios pequeños y verificables; entrega siempre código que compile (`tsc --noEmit`).
- Si algo de este archivo no coincide con el código, **el código manda**; actualiza este archivo en el mismo cambio.
