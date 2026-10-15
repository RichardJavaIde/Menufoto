//src/app/api/tv/[token]/ping/route.ts
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Latido de la pantalla: solo marca la hora de la última conexión.
// En memoria se limita a un registro cada 30 segundos por pantalla.
const g = globalThis as unknown as { __tvPing?: Map<string, number> };
const lastPing = (g.__tvPing ??= new Map<string, number>());
const MIN_GAP_MS = 30_000;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(token)) return new Response(null, { status: 404 });

  const now = Date.now();
  if (now - (lastPing.get(token) ?? 0) < MIN_GAP_MS) return new Response(null, { status: 204 });

  if (lastPing.size > 500) lastPing.clear();
  lastPing.set(token, now);

  const { count } = await prisma.tvScreen.updateMany({
    where: { token },
    data: { lastSeenAt: new Date(now) },
  });
  return new Response(null, { status: count > 0 ? 204 : 404 });
}