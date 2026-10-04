//src/lib/hours.ts
export type HourRow = {
  dayOfWeek: number; // 0 = domingo ... 6 = sábado
  opensAt: string | null;
  closesAt: string | null;
  closed: boolean;
};


export const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
export const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // empieza en lunes
// "22:00" → "10:00 p. m."
export function formatTime(value: string) {
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return value;
  const suffix = h >= 12 ? "p. m." : "a. m.";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

function isOpen(row?: HourRow): row is HourRow & { opensAt: string; closesAt: string } {
  return Boolean(row && !row.closed && row.opensAt && row.closesAt);
}

export function hasOpenDay(hours: HourRow[]) {
  return hours.some((h) => isOpen(h));
}

function describe(row?: HourRow) {
  return isOpen(row) ? `${formatTime(row.opensAt)} – ${formatTime(row.closesAt)}` : "Cerrado";
}

// Agrupa días consecutivos con el mismo horario: "Lunes a Viernes"
export function groupHours(hours: HourRow[]): { label: string; text: string }[] {
  const byDay = new Map(hours.map((h) => [h.dayOfWeek, h]));
  const rows = DISPLAY_ORDER.map((day) => ({ day, text: describe(byDay.get(day)) }));

  const groups: { days: number[]; text: string }[] = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (last && last.text === row.text) last.days.push(row.day);
    else groups.push({ days: [row.day], text: row.text });
  }

  return groups.map((g) => ({
    label:
      g.days.length === 1
        ? DAY_NAMES[g.days[0]]
        : `${DAY_NAMES[g.days[0]]} a ${DAY_NAMES[g.days[g.days.length - 1]]}`,
    text: g.text,
  }));
}