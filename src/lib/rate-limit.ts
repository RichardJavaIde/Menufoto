//src/lib/rate-limit.ts
// Límite de intentos en memoria. Es suficiente para un solo servidor.
// Se reinicia si el servidor se reinicia.
type Entry = { count: number; first: number };

const WINDOW_MS = 15 * 60 * 1000;

const g = globalThis as unknown as { __loginAttempts?: Map<string, Entry> };
const store = (g.__loginAttempts ??= new Map<string, Entry>());

function prune(now: number) {
  for (const [key, e] of store) {
    if (now - e.first > WINDOW_MS) store.delete(key);
  }
}

/** Devuelve los minutos que faltan para poder reintentar, o 0 si no está bloqueado. */
export function blockedMinutes(key: string, max: number): number {
  const e = store.get(key);
  if (!e) return 0;
  const now = Date.now();
  if (now - e.first > WINDOW_MS) {
    store.delete(key);
    return 0;
  }
  if (e.count < max) return 0;
  return Math.max(1, Math.ceil((e.first + WINDOW_MS - now) / 60000));
}

export function registerFailure(key: string) {
  const now = Date.now();
  const e = store.get(key);
  if (!e || now - e.first > WINDOW_MS) {
    store.set(key, { count: 1, first: now });
  } else {
    e.count += 1;
  }
  if (store.size > 5000) prune(now);
}

export function clearFailures(key: string) {
  store.delete(key);
}