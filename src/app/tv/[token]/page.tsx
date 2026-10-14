//src/app/tv/[token]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTvData, tvEtag, tvPayload } from "@/lib/tv-data";
import { resolveTheme } from "@/themes/resolve";
import { fontVariableClasses } from "@/themes/fonts";
import { MenuTheme } from "@/components/menu/menu-theme";
import { TvPlayer } from "@/components/tv/tv-player";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pantalla TV",
  robots: { index: false, follow: false },
};

export default async function TvPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getTvData(token);
  if (!data) notFound();

  if (data.status === "inactive") {
    // Se vuelve a intentar sola cada minuto
    return (
      <main className="fixed inset-0 flex items-center justify-center bg-black text-white">
        <meta httpEquiv="refresh" content="60" />
        <p className="text-3xl">Pantalla desactivada</p>
      </main>
    );
  }

  const resolved = resolveTheme(data.appearance);
  const fontClasses = fontVariableClasses([resolved.fonts.heading, resolved.fonts.body]);

  return (
    <div className={fontClasses}>
      <MenuTheme resolved={resolved} className="fixed inset-0 cursor-none overflow-hidden">
        <TvPlayer
          token={token}
          initial={tvPayload(data)}
          etag={tvEtag(data)}
          serverNowMs={data.serverNowMs}
        />
      </MenuTheme>
    </div>
  );
}