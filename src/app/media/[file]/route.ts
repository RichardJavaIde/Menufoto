//src/app/media/[file]/route.ts
import { promises as fs } from "node:fs";
import { getCurrentUser } from "@/lib/auth";
import { filePath } from "@/lib/images";

export const runtime = "nodejs";

const FILE_RE = /^[a-f0-9]{24}-(src|480|960)\.webp$/;

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const match = FILE_RE.exec(file);
  if (!match) return new Response("No encontrado", { status: 404 });

  // La copia base sin recortar solo la ve el panel de administración
  const isSource = match[1] === "src";
  if (isSource && !(await getCurrentUser())) {
    return new Response("No autorizado", { status: 401 });
  }

  try {
    const data = await fs.readFile(filePath(file));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": isSource
          ? "private, max-age=31536000, immutable"
          : "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("No encontrado", { status: 404 });
  }
}