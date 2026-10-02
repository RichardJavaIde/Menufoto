//src/components/admin/nav-items.ts
import {
  LayoutDashboard,
  Layers,
  UtensilsCrossed,
  Tags,
  Palette,
  QrCode,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Section } from "@/lib/permissions";

export type NavItem = {
  section: Section;
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { section: "dashboard", href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { section: "categorias", href: "/admin/categorias", label: "Categorías", icon: Layers },
  { section: "platos", href: "/admin/platos", label: "Platos", icon: UtensilsCrossed },
  { section: "etiquetas", href: "/admin/etiquetas", label: "Etiquetas", icon: Tags },
  { section: "apariencia", href: "/admin/apariencia", label: "Apariencia", icon: Palette },
  { section: "qr", href: "/admin/qr", label: "Código QR", icon: QrCode },
  { section: "configuracion", href: "/admin/configuracion", label: "Configuración", icon: Settings },
  { section: "usuarios", href: "/admin/usuarios", label: "Usuarios", icon: Users },
];