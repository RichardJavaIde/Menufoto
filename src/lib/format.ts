//src/lib/format.ts
export function formatPrice(cents: number, symbol = "RD$") {
  const value = (cents / 100).toLocaleString("es-DO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol} ${value}`;
}