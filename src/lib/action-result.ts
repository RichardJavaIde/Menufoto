//src/lib/action-result.ts
export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };