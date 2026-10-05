# Menú Digital Visual

Menú digital visual para un restaurante: carta pública con 5 temas, panel
de administración, fotos optimizadas y código QR.

## Requisitos
- Node.js 20 o superior

## Instalación
```bash
npm install
cp .env.example .env     # en Windows: Copy-Item .env.example .env
# completa los valores del .env
npx prisma migrate dev
npx prisma db seed
npm run dev
```
- Menú público: http://localhost:3000
- Panel: http://localhost:3000/admin

## Roles
- **ADMIN**: acceso completo (apariencia, configuración, usuarios).
- **USER**: categorías, platos, etiquetas y código QR.

## Datos
- Base de datos: PostgreSQL en Neon (`DATABASE_URL` y `DIRECT_URL`).
- Fotos: Vercel Blob (`BLOB_READ_WRITE_TOKEN`).
Ambos servicios guardan su propio historial y respaldos desde sus paneles.

Respaldo: `npm run backup` (crea un ZIP en `backups/`).

## Seguridad
- Contraseñas con bcrypt, sesión en cookie httpOnly.
- Límite de intentos de login (5 por correo, 20 por IP, cada 15 min).
- Subida de fotos validada por contenido (JPG, PNG, WebP; máx. 8 MB).