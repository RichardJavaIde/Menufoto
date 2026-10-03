//src/components/menu/sample.ts
import type { MenuCategory } from "./types";

export const SAMPLE_MENU: MenuCategory[] = [
  {
    id: "sample-1",
    name: "Entradas",
    description: "Para comenzar",
    dishes: [
      {
        id: "s1",
        name: "Tostones rellenos",
        description: "Plátano verde frito relleno de camarones al ajillo.",
        priceCents: 35000,
        available: true,
        tags: [{ id: "t1", name: "Especialidad de la casa", icon: "⭐" }],
        image: null,
      },
      {
        id: "s2",
        name: "Yuquitas con salsa picante",
        description: "Croquetas de yuca crujientes con salsa de ají.",
        priceCents: 22000,
        available: true,
        tags: [{ id: "t2", name: "Picante", icon: "🌶️" }],
        image: null,
      },
    ],
  },
  {
    id: "sample-2",
    name: "Platos fuertes",
    description: "Cocina criolla de la casa",
    dishes: [
      {
        id: "s3",
        name: "Sancocho de tres carnes",
        description: "Caldo tradicional con víveres, arroz blanco y aguacate.",
        priceCents: 45000,
        available: true,
        tags: [],
        image: null,
      },
      {
        id: "s4",
        name: "Pollo guisado",
        description: "Guisado lentamente con arroz, habichuelas y ensalada.",
        priceCents: 38000,
        available: false,
        tags: [],
        image: null,
      },
    ],
  },
];