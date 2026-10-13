//src/lib/tz.ts
// Conversión entre fechas "de calendario" (YYYY-MM-DD) y UTC según la zona horaria del restaurante.

function offsetMs(timeZone: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p = Object.fromEntries(dtf.formatToParts(date).map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

// "2026-10-15" + "23:59:59" en la zona dada -> instante UTC (Date)
export function zonedTimeToUtc(dateStr: string, time: string, timeZone: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm, ss] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm, ss);
  const off = offsetMs(timeZone, new Date(guess));
  let utc = guess - off;
  const off2 = offsetMs(timeZone, new Date(utc));
  if (off2 !== off) utc = guess - off2;
  return new Date(utc);
}

// Instante UTC -> "YYYY-MM-DD" en la zona dada
export function utcToZonedDateStr(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}