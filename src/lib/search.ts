//src/lib/search.ts
// Quita tildes y mayúsculas: "Piña" → "pina"
export function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// El plato coincide si contiene todas las palabras buscadas
export function matchesQuery(haystack: string, query: string) {
  const terms = normalizeText(query).split(" ").filter(Boolean);
  return terms.every((term) => haystack.includes(term));
}