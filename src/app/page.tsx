//src/app/page.tsx
import type { Metadata, Viewport } from "next";
import { getMenuData } from "@/lib/menu-data";
import { resolveTheme } from "@/themes/resolve";
import { fontVariableClasses } from "@/themes/fonts";
import { MenuTheme } from "@/components/menu/menu-theme";
import { MenuHeader } from "@/components/menu/menu-header";
import { MenuBody } from "@/components/menu/menu-parts";
import { MenuFooter } from "@/components/menu/menu-footer";
import { CategoryNav } from "@/components/menu/category-nav";
import { RestaurantJsonLd } from "@/components/menu/json-ld";
import { PhotoViewer } from "@/components/menu/photo-viewer";

// Se regenera sola cada 5 minutos; además, cada cambio en el panel la actualiza al instante
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { restaurant } = await getMenuData();
  return {
    title: `${restaurant.name} · Menú`,
    description:
      restaurant.description ?? restaurant.tagline ?? `Carta digital de ${restaurant.name}`,
  };
}

export async function generateViewport(): Promise<Viewport> {
  const { appearance } = await getMenuData();
  return { themeColor: resolveTheme(appearance).colors.background };
}

export default async function PublicMenuPage() {
  const { restaurant, appearance, hours, categories } = await getMenuData();

  const resolved = resolveTheme(appearance);
  const fontClasses = fontVariableClasses([resolved.fonts.heading, resolved.fonts.body]);

  return (
    <div className={fontClasses}>
      <RestaurantJsonLd
        name={restaurant.name}
        description={restaurant.description}
        address={restaurant.address}
        phone={restaurant.phone}
      />
      <MenuTheme resolved={resolved} className="min-h-screen">
        <MenuHeader
          name={restaurant.name}
          tagline={restaurant.tagline}
          description={restaurant.description}
          logo={restaurant.logo}
          cover={restaurant.cover}
        />

        {categories.length > 0 && (
          <CategoryNav items={categories.map((c) => ({ id: c.id, name: c.name }))} />
        )}

                <main className="mt-container">
          {categories.length === 0 ? (
            <p className="mt-empty">Pronto publicaremos nuestra carta.</p>
          ) : (
            <>
              <MenuBody categories={categories} symbol={restaurant.currencySymbol} />
              <p id="mt-no-results" className="mt-empty" role="status" hidden />
            </>
          )}
        </main>

        <MenuFooter
          address={restaurant.address}
          phone={restaurant.phone}
          whatsapp={restaurant.whatsapp}
          email={restaurant.email}
          instagram={restaurant.instagram}
          facebook={restaurant.facebook}
          website={restaurant.website}
          hours={hours}
        />
        <PhotoViewer />
      </MenuTheme>
    </div>
  );
}