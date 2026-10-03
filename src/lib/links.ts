//src/lib/links.ts
function digits(value: string) {
  return value.replace(/\D/g, "");
}

export function telUrl(value?: string | null) {
  const cleaned = value?.replace(/[^\d+]/g, "");
  return cleaned && digits(cleaned).length >= 7 ? `tel:${cleaned}` : null;
}

export function whatsappUrl(value?: string | null) {
  const d = digits(value ?? "");
  return d.length >= 7 ? `https://wa.me/${d}` : null;
}

export function mailUrl(value?: string | null) {
  const email = value?.trim();
  return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? `mailto:${email}` : null;
}

// Solo acepta http o https; cualquier otra cosa (por ejemplo javascript:) se descarta
export function webUrl(value?: string | null) {
  const text = value?.trim();
  if (!text) return null;
  const withProtocol = /^https?:\/\//i.test(text) ? text : `https://${text}`;
  try {
    const url = new URL(withProtocol);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

// Acepta "@usuario", "usuario" o un enlace completo
export function socialUrl(base: string, value?: string | null) {
  const text = value?.trim();
  if (!text) return null;
  if (/^https?:\/\//i.test(text)) return webUrl(text);
  const handle = text.replace(/^@/, "").replace(/[^\w.-]/g, "");
  return handle ? `${base}${handle}` : null;
}