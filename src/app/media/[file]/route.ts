//src/app/media/[file]/route.ts
import { isSafeName, readLocalFile, storageDriver } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  if (storageDriver() !== "local" || !isSafeName(file)) {
    return new Response("No encontrado", { status: 404 });
  }
  try {
    const data = await readLocalFile(file);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("No encontrado", { status: 404 });
  }
}