//src/components/menu/json-ld.tsx
type Props = {
  name: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
};

export function RestaurantJsonLd({ name, description, address, phone }: Props) {
  const base = (process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL)?.replace(/\/$/, "");

  const data = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name,
    ...(description ? { description } : {}),
    ...(address ? { address } : {}),
    ...(phone ? { telephone: phone } : {}),
    ...(base ? { url: `${base}/`, hasMenu: `${base}/` } : {}),
  };

  return (
    <script
      type="application/ld+json"
      // Se escapa "<" para que ningún texto del restaurante pueda cerrar la etiqueta
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}