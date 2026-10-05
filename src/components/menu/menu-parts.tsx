//src/components/menu/menu-parts.tsx
import { formatPrice } from "@/lib/format";
import { mediaSrcSet, mediaUrl } from "@/lib/media";
import { normalizeText } from "@/lib/search";
import type { MenuCategory, MenuDish } from "./types";

export function Divider() {
  return (
    <div className="mt-divider" role="separator">
      <span className="mt-divider-mark" aria-hidden>
        ✦
      </span>
    </div>
  );
}

export function CategoryHeading({
  name,
  description,
  index,
}: {
  name: string;
  description: string | null;
  index: number;
}) {
  return (
    <header className="mt-heading">
      <span className="mt-heading-num" aria-hidden>
        {String(index + 1).padStart(2, "0")}
      </span>
      <h2 className="mt-heading-name">{name}</h2>
      {description && <p className="mt-heading-desc">{description}</p>}
    </header>
  );
}

export function DishItem({
  dish,
  symbol,
  categoryName = "",
  placeholder = false,
}: {
  dish: MenuDish;
  symbol: string;
  categoryName?: string;
  placeholder?: boolean;
}) {
  const hasImage = Boolean(dish.image) || placeholder;

  // Texto sobre el que busca el menú público (ya sin tildes ni mayúsculas)
  const searchText = normalizeText(
    [
      dish.name,
      dish.description ?? "",
      categoryName,
      ...dish.tags.map((t) => t.name),
      dish.available ? "" : "agotado",
    ].join(" ")
  );

  return (
    <article
      className="mt-dish"
      data-search={searchText}
      data-has-image={hasImage ? "" : undefined}
      data-soldout={!dish.available ? "" : undefined}
    >
      {hasImage && (
        <div className="mt-dish-media"
          data-zoom-src={dish.image ? mediaUrl(dish.image.key, 960) : undefined}
          data-zoom-name={dish.image ? dish.name : undefined}
          data-zoom-price={dish.image ? formatPrice(dish.priceCents, symbol) : undefined}
          data-zoom-desc={dish.image ? (dish.description ?? "") : undefined}
          role={dish.image ? "button" : undefined}
          tabIndex={dish.image ? 0 : undefined}
          aria-label={dish.image ? `Ver foto de ${dish.name}` : undefined}>
          {dish.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="mt-dish-img"
              src={mediaUrl(dish.image.key, 480)}
              srcSet={mediaSrcSet(dish.image.key)}
              sizes="(min-width: 560px) 320px, 90vw"
              alt={dish.name}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="mt-dish-img mt-placeholder" aria-hidden />
          )}
        </div>
      )}

      <div className="mt-dish-body">
        <div className="mt-dish-head">
          <h3 className="mt-dish-name">{dish.name}</h3>
          <span className="mt-dish-leader" aria-hidden />
          <span className="mt-dish-price">{formatPrice(dish.priceCents, symbol)}</span>
        </div>

        {dish.description && <p className="mt-dish-desc">{dish.description}</p>}

        {(!dish.available || dish.tags.length > 0) && (
          <ul className="mt-dish-meta">
            {!dish.available && <li className="mt-soldout">Agotado</li>}
            {dish.tags.map((t) => (
              <li key={t.id} className="mt-tag">
                {t.icon && <span aria-hidden>{t.icon}</span>}
                {t.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

export function MenuSection({
  category,
  index,
  symbol,
  placeholderImages = false,
}: {
  category: MenuCategory;
  index: number;
  symbol: string;
  placeholderImages?: boolean;
}) {
  return (
    <section id={`cat-${category.id}`} className="mt-section">
      <CategoryHeading name={category.name} description={category.description} index={index} />
      <div className="mt-dishes">
        {category.dishes.map((d) => (
          <DishItem
            key={d.id}
            dish={d}
            symbol={symbol}
            categoryName={category.name}
            placeholder={placeholderImages}
          />
        ))}
      </div>
    </section>
  );
}

export function MenuBody({
  categories,
  symbol,
  placeholderImages = false,
}: {
  categories: MenuCategory[];
  symbol: string;
  placeholderImages?: boolean;
}) {
  return (
    <div className="mt-menu">
      {categories.map((c, i) => (
        <div key={c.id} className="contents">
          {i > 0 && <Divider />}
          <MenuSection
            category={c}
            index={i}
            symbol={symbol}
            placeholderImages={placeholderImages}
          />
        </div>
      ))}
    </div>
  );
}