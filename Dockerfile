FROM node:22-bookworm-slim AS base
RUN apt-get update -y \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Dependencias
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# Compilación (valores falsos solo para que compile; no pasan a la imagen final)
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_OUTPUT=standalone \
    STORAGE_DRIVER=local \
    DATABASE_URL=postgresql://build:build@localhost:5432/build \
    DIRECT_URL=postgresql://build:build@localhost:5432/build \
    SESSION_SECRET=solo-para-compilar-no-se-usa-en-produccion
RUN npx prisma generate && npm run build

# CLI de Prisma, solo para aplicar migraciones al arrancar
FROM base AS prisma-cli
RUN npm install --prefix /opt/prisma prisma@6

# Imagen final
FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    STORAGE_DRIVER=local \
    UPLOAD_DIR=/data/uploads
RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs \
 && mkdir -p /data/uploads \
 && chown -R nextjs:nodejs /data
COPY --from=prisma-cli --chown=nextjs:nodejs /opt/prisma /opt/prisma
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
USER nextjs
EXPOSE 3000
CMD ["sh", "-c", "/opt/prisma/node_modules/.bin/prisma migrate deploy --schema=prisma/schema.prisma && node scripts/bootstrap.mjs && node server.js"]