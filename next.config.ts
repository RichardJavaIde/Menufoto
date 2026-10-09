import type { NextConfig } from "next";

const useBlob =
  (process.env.STORAGE_DRIVER ?? (process.env.BLOB_READ_WRITE_TOKEN ? "blob" : "local")) === "blob";

// Solo hace falta con Blob. Con almacenamiento en disco las fotos salen de /media en el mismo dominio.
function mediaBase() {
  if (!useBlob) return "";
  const explicit = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const storeId = (process.env.BLOB_READ_WRITE_TOKEN ?? "").split("_")[3];
  return storeId ? `https://${storeId.toLowerCase()}.public.blob.vercel-storage.com` : "";
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // "standalone" lo activa el Dockerfile. En Windows y en Vercel no hace falta.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  env: { NEXT_PUBLIC_MEDIA_BASE_URL: mediaBase() },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;