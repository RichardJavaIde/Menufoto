//src/components/menu/menu-header.tsx
import { mediaSrcSet, mediaUrl, type ImageInfo } from "@/lib/media";

export function MenuHeader({
  name,
  tagline,
  description,
  logo,
  cover,
}: {
  name: string;
  tagline: string | null;
  description: string | null;
  logo: ImageInfo | null;
  cover: ImageInfo | null;
}) {
  return (
    <header
      className="mt-hero"
      data-cover={cover ? "" : undefined}
      data-logo={logo ? "" : undefined}
    >
      {cover && (
        <div className="mt-hero-cover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaUrl(cover.key, 960)}
            srcSet={mediaSrcSet(cover.key)}
            sizes="100vw"
            alt=""
            fetchPriority="high"
            decoding="async"
          />
        </div>
      )}

      <div className="mt-hero-inner">
        {logo && (
          <div className="mt-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaUrl(logo.key, 480)}
              alt={`Logo de ${name}`}
              fetchPriority="high"
              decoding="async"
            />
          </div>
        )}
        <h1 className="mt-hero-name">{name}</h1>
        {tagline && <p className="mt-hero-tagline">{tagline}</p>}
        {description && <p className="mt-hero-desc">{description}</p>}
      </div>
    </header>
  );
}