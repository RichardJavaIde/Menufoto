//src/app/api/tv/[token]/route.ts
import { NextResponse } from "next/server";
import { BOOT_ID, getTvData, tvEtag, tvPayload } from "@/lib/tv-data";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const noStore = { "Cache-Control": "no-store" };

  const data = await getTvData(token);
  if (!data) {
    return NextResponse.json({ status: "missing" }, { status: 404, headers: noStore });
  }
  if (data.status === "inactive") {
    return NextResponse.json({ status: "inactive", bootId: BOOT_ID }, { headers: noStore });
  }

  const etag = tvEtag(data);
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers: { ...noStore, ETag: etag } });
  }

  return NextResponse.json(
    { status: "ok", ...tvPayload(data) },
    { headers: { ...noStore, ETag: etag } }
  );
}