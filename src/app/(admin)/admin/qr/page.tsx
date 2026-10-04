//src/app/(admin)/admin/qr/page.tsx
import { prisma } from "@/lib/prisma";
import { requireSection } from "@/lib/auth";
import { mediaUrl } from "@/lib/media";
import { QrGenerator } from "@/components/admin/qr/qr-generator";

export const dynamic = "force-dynamic";

export default async function QrPage() {
  await requireSection("qr");

  const settings = await prisma.restaurantSettings.findUnique({
    where: { id: 1 },
  });

  const logo = settings?.logoId
    ? await prisma.image.findUnique({ where: { id: settings.logoId } })
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Código QR</h1>
        <p className="text-sm text-neutral-500 print:hidden">
          Genera el QR para que tus clientes abran el menú desde el celular.
          Descárgalo o imprime la tarjeta para tus mesas.
        </p>
      </div>

      <QrGenerator
        restaurantName={settings?.name || "Mi restaurante"}
        tagline={settings?.tagline ?? null}
        logoUrl={logo ? mediaUrl(logo.fileKey, 480) : null}
      />
    </div>
  );
}