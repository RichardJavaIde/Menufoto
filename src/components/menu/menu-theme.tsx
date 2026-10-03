//src/components/menu/menu-theme.tsx
import "./menu.css";
import type { ResolvedTheme } from "@/themes/resolve";

export function MenuTheme({
  resolved,
  className = "",
  children,
}: {
  resolved: ResolvedTheme;
  className?: string;
  children: React.ReactNode;
}) {
  const { attrs, style } = resolved;
  return (
    <div
      className={`mt-root ${className}`}
      style={style}
      data-heading={attrs.heading}
      data-dish={attrs.dish}
      data-divider={attrs.divider}
      data-price={attrs.price}
      data-tag={attrs.tag}
    >
      {children}
    </div>
  );
}