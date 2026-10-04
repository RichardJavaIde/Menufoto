//src/app/(admin)/admin/configuracion/page.tsx
import { prisma } from "@/lib/prisma";
import { requireSection } from "@/lib/auth";
import { toImageInfo } from "@/lib/media";
import { DISPLAY_ORDER } from "@/lib/hours";
import { IdentityForm } from "@/components/admin/settings/identity-form";
import { ContactForm } from "@/components/admin/settings/contact-form";
import { CurrencyForm } from "@/components/admin/settings/currency-form";
import { HoursForm, type HourFormRow } from "@/components/admin/settings/hours-form";

export default async function ConfiguracionPage() {
  await requireSection("configuracion"); // solo ADMIN

  const [settings, hours] = await Promise.all([
    prisma.restaurantSettings.findUnique({
      where: { id: 1 },
      include: { logo: true, cover: true },
    }),
    prisma.openingHour.findMany(),
  ]);

  // Siempre los 7 días, de lunes a domingo
  const hourRows: HourFormRow[] = DISPLAY_ORDER.map((day) => {
    const h = hours.find((x) => x.dayOfWeek === day);
    return {
      dayOfWeek: day,
      closed: h ? h.closed || !h.opensAt || !h.closesAt : false,
      opensAt: h?.opensAt ?? "11:00",
      closesAt: h?.closesAt ?? "22:00",
    };
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Configuración</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Los datos de tu restaurante. Cada sección se guarda por separado.
        </p>
      </div>

      <IdentityForm
        initial={{
          name: settings?.name ?? "Mi Restaurante",
          tagline: settings?.tagline ?? "",
          description: settings?.description ?? "",
          logo: settings?.logo ? toImageInfo(settings.logo) : null,
          cover: settings?.cover ? toImageInfo(settings.cover) : null,
        }}
      />

      <ContactForm
        initial={{
          address: settings?.address ?? "",
          phone: settings?.phone ?? "",
          whatsapp: settings?.whatsapp ?? "",
          email: settings?.email ?? "",
          instagram: settings?.instagram ?? "",
          facebook: settings?.facebook ?? "",
          website: settings?.website ?? "",
        }}
      />

      <CurrencyForm
        initial={{
          code: settings?.currencyCode ?? "DOP",
          symbol: settings?.currencySymbol ?? "RD$",
        }}
      />

      <HoursForm initial={hourRows} />
    </div>
  );
}
