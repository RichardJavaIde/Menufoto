//src/lib/tv-frames.ts
// Lógica pura del reproductor (sin base de datos): decide qué se muestra y cuándo.

export type TvEffect = "FADE" | "SLIDE" | "ZOOM" | "KENBURNS";
export type TvSlideType = "OFFERS" | "POPULAR" | "CATEGORY" | "GALLERY";

export type TvDish = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  available: boolean;
  popular: boolean;
  categoryId: string;
  imageKey: string | null;
  offerCents: number | null;
  offerStartMs: number | null;
  offerEndMs: number | null;
};

export type TvCategory = { id: string; name: string };

export type TvSlideConfig = {
  id: string;
  type: TvSlideType;
  seconds: number;
  effect: TvEffect;
  days: number | null; // bits: 0 = domingo ... 6 = sábado
  startMinute: number | null;
  endMinute: number | null;
  categoryId: string | null;
};

export type TvFrameDish = TvDish & { offer: number | null };

export type TvFrame = {
  key: string;
  kind: "OFFERS" | "POPULAR" | "CATEGORY";
  seconds: number;
  effect: TvEffect;
  title: string;
  page: number;
  pages: number;
  dishes: TvFrameDish[];
};

const PER_PAGE = { OFFERS: 3, POPULAR: 3, CATEGORY: 10 } as const;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function activeOfferCents(d: TvDish, nowMs: number): number | null {
  if (d.offerCents === null) return null;
  if (d.offerStartMs !== null && nowMs < d.offerStartMs) return null;
  if (d.offerEndMs !== null && nowMs > d.offerEndMs) return null;
  return d.offerCents;
}

// Día de la semana y minutos desde medianoche en la zona del restaurante
function zonedParts(timeZone: string, nowMs: number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(nowMs));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  return {
    day: Math.max(0, WEEKDAYS.indexOf(get("weekday"))),
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

function inSchedule(slide: TvSlideConfig, timeZone: string, nowMs: number) {
  if (slide.days === null && slide.startMinute === null && slide.endMinute === null) {
    return true;
  }
  const { day, minutes } = zonedParts(timeZone, nowMs);
  if (slide.days !== null && (slide.days & (1 << day)) === 0) return false;
  if (slide.startMinute !== null && slide.endMinute !== null) {
    const s = slide.startMinute;
    const e = slide.endMinute;
    return s <= e ? minutes >= s && minutes < e : minutes >= s || minutes < e;
  }
  return true;
}

export function buildFrames(
  slides: TvSlideConfig[],
  dishes: TvDish[],
  categories: TvCategory[],
  timeZone: string,
  nowMs: number
): TvFrame[] {
  const frames: TvFrame[] = [];

  for (const slide of slides) {
    const kind = slide.type;
    if (kind === "GALLERY") continue; // llega en la Fase 2
    if (!inSchedule(slide, timeZone, nowMs)) continue;

    let title = "";
    let list: TvFrameDish[] = [];

    if (kind === "OFFERS") {
      title = "Ofertas";
      list = dishes
        .map((d) => ({ ...d, offer: activeOfferCents(d, nowMs) }))
        .filter((d) => d.available && d.offer !== null);
    } else if (kind === "POPULAR") {
      title = "Los más pedidos";
      list = dishes
        .filter((d) => d.available && d.popular)
        .map((d) => ({ ...d, offer: activeOfferCents(d, nowMs) }));
    } else {
      const category = categories.find((c) => c.id === slide.categoryId);
      if (!category) continue;
      title = category.name;
      list = dishes
        .filter((d) => d.categoryId === category.id)
        .map((d) => ({ ...d, offer: activeOfferCents(d, nowMs) }));
    }

    if (list.length === 0) continue;

    const size = PER_PAGE[kind];
    const pages = Math.ceil(list.length / size);
    for (let i = 0; i < pages; i++) {
      frames.push({
        key: `${slide.id}:${i}`,
        kind,
        seconds: Math.max(3, slide.seconds),
        effect: slide.effect,
        title,
        page: i + 1,
        pages,
        dishes: list.slice(i * size, (i + 1) * size),
      });
    }
  }

  return frames;
}

// Lo que el servidor entrega al reproductor (y que se compara por ETag)
export type TvPayload = {
  bootId: string;
  appearanceKey: string;
  restaurantName: string;
  logoKey: string | null;
  currencySymbol: string;
  timezone: string;
  slides: TvSlideConfig[];
  dishes: TvDish[];
  categories: TvCategory[];
};