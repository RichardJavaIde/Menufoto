//src/themes/fonts.ts
import {
  Playfair_Display,
  Cormorant_Garamond,
  DM_Serif_Display,
  Lora,
  Libre_Baskerville,
  Abril_Fatface,
  Amatic_SC,
  Inter,
  Montserrat,
  Poppins,
  Work_Sans,
  Oswald,
} from "next/font/google";
import type { FontKey } from "./font-options";

// preload: false → el navegador solo descarga las tipografías que el menú realmente usa
const playfair = Playfair_Display({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-playfair" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], display: "swap", preload: false, weight: ["400", "500", "600", "700"], variable: "--font-cormorant" });
const dmserif = DM_Serif_Display({ subsets: ["latin"], display: "swap", preload: false, weight: "400", variable: "--font-dmserif" });
const lora = Lora({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-lora" });
const baskerville = Libre_Baskerville({ subsets: ["latin"], display: "swap", preload: false, weight: ["400", "700"], variable: "--font-baskerville" });
const abril = Abril_Fatface({ subsets: ["latin"], display: "swap", preload: false, weight: "400", variable: "--font-abril" });
const amatic = Amatic_SC({ subsets: ["latin"], display: "swap", preload: false, weight: ["400", "700"], variable: "--font-amatic" });
const inter = Inter({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-inter" });
const montserrat = Montserrat({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-montserrat" });
const poppins = Poppins({ subsets: ["latin"], display: "swap", preload: false, weight: ["400", "500", "600", "700"], variable: "--font-poppins" });
const worksans = Work_Sans({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-worksans" });
const oswald = Oswald({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-oswald" });

const VARIABLE_CLASS: Record<FontKey, string> = {
  playfair: playfair.variable,
  cormorant: cormorant.variable,
  dmserif: dmserif.variable,
  lora: lora.variable,
  baskerville: baskerville.variable,
  abril: abril.variable,
  amatic: amatic.variable,
  inter: inter.variable,
  montserrat: montserrat.variable,
  poppins: poppins.variable,
  worksans: worksans.variable,
  oswald: oswald.variable,
};

// Clases que hay que poner en un contenedor para que sus tipografías estén disponibles
export function fontVariableClasses(keys: FontKey[]) {
  return Array.from(new Set(keys))
    .map((k) => VARIABLE_CLASS[k])
    .join(" ");
}

// Para el panel de Apariencia, donde se puede previsualizar cualquier tipografía
export const ALL_FONT_VARIABLES = Object.values(VARIABLE_CLASS).join(" ");