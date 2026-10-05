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

# Menú Digital Visual

Menú digital para **un solo restaurante**, pensado para verse bien en celulares, tabletas y computadoras. La carta pública es visual y editorial, con fotos opcionales de los platos. El dueño la administra desde un panel privado, sin tocar código.

> **Alcance.** Es un menú para mostrar, no un sistema de pedidos. No incluye carrito, pagos, delivery, reservas, facturación, inventario ni varios restaurantes.

---

## Qué hace el sistema

### Menú público (`/`)
- Muestra categorías y platos con nombre, descripción, precio, foto y etiquetas (Vegetariano, Picante, Nuevo…).
- Los platos no disponibles aparecen como **Agotado**.
- Barra de categorías fija con resaltado automático al desplazarse, y **búsqueda** que ignora acentos y mayúsculas.
- Encabezado con logo y portada, y pie con dirección, teléfono, WhatsApp, correo, redes y **horarios** agrupados por día.
- **5 temas** visuales intercambiables: Elegante, Moderno, Rústico, Premium oscuro y Editorial/Revista. Cada tema puede personalizarse con colores y tipografías.
- Carga rápida: se genera en el servidor, las fotos se cargan bajo demanda y casi no usa JavaScript.

### Panel de administración (`/admin`)
| Sección | Función | Acceso |
|---|---|---|
| Dashboard | Resumen general | ADMIN y USER |
| Categorías | Crear, editar, ordenar, activar o eliminar | ADMIN y USER |
| Platos | Precio, descripción, foto con recorte, etiquetas, visible y disponible, orden | ADMIN y USER |
| Etiquetas | Crear y ordenar las etiquetas de los platos | ADMIN y USER |
| Código QR | Generar el QR del menú, descargar PNG o SVG e imprimir una tarjeta | ADMIN y USER |
| Apariencia | Elegir tema, colores y tipografías (con avisos de contraste) | Solo ADMIN |
| Configuración | Identidad, logo y portada, contacto, moneda y horarios | Solo ADMIN |
| Usuarios | Crear usuarios, cambiar rol y contraseña, desactivar | Solo ADMIN |

Cada guardado, edición o eliminación muestra una **notificación**, y las pantallas muestran **spinners** mientras cargan.

### Roles
- **ADMIN:** acceso total.
- **USER:** gestiona el contenido del menú. No ve ni puede abrir Configuración, Apariencia ni Usuarios, ni siquiera escribiendo la dirección a mano.

---

## Tecnologías

| Capa | Tecnología | Para qué se usa |
|---|---|---|
| Framework | **Next.js** (App Router) + **React 19** | Páginas en servidor, acciones de servidor y rutas de API |
| Lenguaje | **TypeScript** | Tipado en todo el proyecto |
| Base de datos | **PostgreSQL** en **Neon** | Datos del menú, usuarios y ajustes |
| ORM | **Prisma 6** | Esquema, migraciones y consultas |
| Fotos | **Vercel Blob** + **sharp** | Almacenamiento público y optimización a WebP |
| Autenticación | **bcryptjs** + **jose** | Contraseñas con hash y sesión en cookie `httpOnly` |
| Validación | **zod** | Validación de todo lo que entra al servidor |
| Estilos | **Tailwind CSS** (panel) y **CSS propio** (menú público) | Interfaz del panel y temas del menú |
| Tipografías | `next/font/google` | 12 familias disponibles para los temas |
| Recorte de fotos | `react-easy-crop` | Elegir el recuadro de cada foto |
| Notificaciones | `sonner` | Avisos al guardar, editar y eliminar |
| QR | `qrcode` | Generar el código QR en el navegador |
| Alojamiento | **Vercel** | Publicación del sitio |

---

## Cómo está organizado

```
prisma/
  schema.prisma        Modelos de datos
  seed.ts              Datos iniciales y menú de ejemplo
  migrations/          Historial de cambios de la base
src/
  app/
    page.tsx           Menú público
    login/             Inicio de sesión
    (admin)/admin/     Panel (dashboard, categorias, platos, etiquetas,
                       apariencia, qr, configuracion, usuarios)
    api/images/        Subida y recorte de fotos
    robots.ts          Reglas para buscadores
    sitemap.ts         Mapa del sitio
  actions/             Acciones de servidor (guardar, editar, eliminar)
  components/
    ui/                Piezas reutilizables (spinner, modal, confirmación)
    admin/             Pantallas y formularios del panel
    menu/              Componentes y estilos del menú público
  lib/                 Lógica compartida
    auth.ts            Usuario actual y control de acceso
    session.ts         Cookie de sesión (JWT)
    permissions.ts     Qué rol puede ver cada sección
    images.ts          Procesado y almacenamiento de fotos
    media.ts           Direcciones de las fotos
    rate-limit.ts      Límite de intentos de login
    menu-data.ts       Lectura del menú con caché
    schemas/           Validaciones zod
  themes/              Definición y resolución de los temas
```

### Datos principales
- **User:** nombre, correo, hash de contraseña, rol (`ADMIN` o `USER`), activo.
- **Category** y **Dish:** un plato pertenece a una categoría. Tiene precio, visible, disponible, orden, foto opcional y etiquetas.
- **Tag:** etiquetas con ícono, relacionadas con los platos (muchos a muchos).
- **Image:** clave del archivo, tamaño, recorte en porcentaje y punto focal.
- **OpeningHour:** horario informativo por día de la semana.
- **RestaurantSettings:** una única fila con la identidad, contacto, moneda, logo, portada y apariencia.

Los **precios se guardan en centavos** (enteros) para evitar errores de redondeo.

---

## Decisiones de diseño

- **Contenido separado de presentación.** Los datos (platos, precios, textos) no cambian al cambiar de tema. Un tema es solo un conjunto de variables de color, tipografía y estilos de disposición. Cambiar de tema nunca borra ni modifica contenido.
- **El menú público se genera en el servidor y se guarda en caché.** Se regenera cada 5 minutos, y también al instante cada vez que se guarda un cambio en el panel.
- **Seguridad del acceso.** La sesión es un JWT en cookie `httpOnly` de 7 días. En cada petición se vuelve a leer el usuario de la base de datos, así que desactivar a alguien o cambiar su rol tiene efecto inmediato. Cada acción de servidor comprueba el permiso por su cuenta, sin depender de que el botón esté oculto. El login limita los intentos fallidos (5 por correo y 20 por IP cada 15 minutos).
- **Fotos.** Se validan por su contenido real (JPG, PNG o WebP), con un mínimo de 400 px en el lado menor. El navegador las reduce a 2000 px antes de enviarlas, porque Vercel limita el tamaño de las peticiones. El servidor genera tres archivos por foto: la copia base, y versiones de 480 y 960 px en WebP. Al cambiar un recorte se genera una clave nueva, para que ningún navegador muestre la foto vieja. Las fotos que se suben y nunca se usan se borran solas después de una hora.
- **Accesibilidad de color.** En Apariencia, los colores elegidos se validan y se avisa cuando el contraste con el fondo es insuficiente.

---

## Variables de entorno

Copia `.env.example` a `.env` y completa los valores.

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Conexión de Neon con *connection pooling* (el host contiene `-pooler`) |
| `DIRECT_URL` | Conexión directa de Neon, usada por las migraciones |
| `SESSION_SECRET` | Texto largo y aleatorio para firmar las sesiones. Debe ser distinto en cada entorno |
| `BLOB_READ_WRITE_TOKEN` | Token de un almacenamiento **público** de Vercel Blob |
| `NEXT_PUBLIC_SITE_URL` | Dirección pública del sitio (sin barra final). Usada por `robots.txt`, sitemap y datos estructurados |
| `NEXT_PUBLIC_MEDIA_BASE_URL` | Opcional. Dirección pública de Blob. Si falta, se calcula a partir del token |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Cuenta de administrador que crea el seed |
| `SEED_USER_EMAIL`, `SEED_USER_PASSWORD` | Opcional. Usuario de prueba con rol USER |

Nunca subas `.env` a Git ni compartas estos valores.

---

## Instalación local

Requisitos: **Node.js 20 o superior**, una base de datos en Neon y un almacenamiento público en Vercel Blob.

```bash
npm install
# crea .env a partir de .env.example y completa los valores
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

- Menú público: http://localhost:3000
- Panel: http://localhost:3000/admin

### Menú de ejemplo
El seed crea el administrador, los horarios, los datos de un restaurante ficticio ("Sazón Criolla") y un menú de ejemplo con 46 platos. El menú de ejemplo solo se carga si la base está vacía. Para borrar categorías, platos y etiquetas y volver a cargarlo:

```powershell
$env:SEED_RESET="1"
npx prisma db seed
Remove-Item Env:SEED_RESET
```

Esto no toca usuarios, logo, portada ni apariencia.

### Comandos útiles
| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilar para producción |
| `npm run start` | Ejecutar la versión compilada |
| `npx prisma migrate dev --name cambio` | Crear una migración tras editar `schema.prisma` |
| `npx prisma migrate deploy` | Aplicar migraciones existentes (producción) |
| `npx prisma studio` | Ver y editar la base en una interfaz visual |

---

## Despliegue

1. **Base de datos:** crear un proyecto en [Neon](https://neon.tech). Copiar la conexión con *pooling* (`DATABASE_URL`) y la directa (`DIRECT_URL`).
2. **Fotos:** en Vercel, crear un almacenamiento **Blob con acceso público** y copiar su token.
3. **Código:** subir el repositorio a GitHub.
4. **Sitio:** importar el repositorio en [Vercel](https://vercel.com) y agregar las variables de entorno **antes** del primer despliegue (la dirección de las fotos se calcula al compilar).
5. **Base de datos de producción:** ejecutar una vez `npx prisma migrate deploy` y `npx prisma db seed` apuntando a la base de producción.
6. Agregar `NEXT_PUBLIC_SITE_URL` con la dirección final y volver a desplegar.

Cada `git push` a la rama `main` publica una nueva versión. Si cambia el esquema de la base, hay que ejecutar `npx prisma migrate deploy` contra producción.

---

## Mantenimiento

- **Respaldos:** Neon conserva el historial de la base y permite crear ramas y restaurar. Las fotos viven en Vercel Blob.
- **Cambios en el contenido:** todo se hace desde el panel. Se refleja en el menú público al guardar.
- **Primer acceso:** entrar con la cuenta del seed y cambiar la contraseña por una propia.

## Límites conocidos
- El límite de intentos del login se guarda en memoria, así que es parcial en un entorno sin servidor como Vercel. Para un uso con riesgo real conviene moverlo a un almacenamiento compartido.
- Neon suspende la base tras un rato sin uso en el plan gratuito, por lo que la primera visita después de una pausa puede tardar un par de segundos.
- El plan gratuito de Vercel (Hobby) es para uso personal. Un sitio de cliente en producción requiere revisar el plan adecuado.