//src/components/admin/appearance/appearance-editor.tsx
"use client";

import { useMemo, useState, useTransition } from "react";
import { RotateCcw } from "lucide-react";
import { notify } from "@/lib/notify";
import { contrastRatio } from "@/lib/color";
import { saveAppearanceAction } from "@/actions/appearance";
import { Spinner } from "@/components/ui/spinner";
import { inputClass, primaryButton, secondaryButton } from "@/components/ui/styles";
import { MenuTheme } from "@/components/menu/menu-theme";
import { MenuBody } from "@/components/menu/menu-parts";
import { SAMPLE_MENU } from "@/components/menu/sample";
import type { MenuCategory } from "@/components/menu/types";
import { THEME_LIST, getTheme } from "@/themes/definitions";
import { FONT_OPTIONS, FONT_KEYS } from "@/themes/font-options";
import { resolveTheme, type Appearance } from "@/themes/resolve";

type ColorKey = "colorBackground" | "colorText" | "colorPrimary" | "colorAccent";

const COLOR_FIELDS: { key: ColorKey; label: string; themeKey: "background" | "text" | "primary" | "accent" }[] = [
  { key: "colorBackground", label: "Fondo", themeKey: "background" },
  { key: "colorText", label: "Texto", themeKey: "text" },
  { key: "colorPrimary", label: "Principal (títulos y precios)", themeKey: "primary" },
  { key: "colorAccent", label: "Acento (detalles y etiquetas)", themeKey: "accent" },
];

const OVERRIDE_KEYS = [
  "colorBackground",
  "colorText",
  "colorPrimary",
  "colorAccent",
  "fontHeading",
  "fontBody",
] as const;

export function AppearanceEditor({
  initial,
  categories,
  currencySymbol,
  restaurantName,
  tagline,
  hasRealPhotos,
}: {
  initial: Appearance;
  categories: MenuCategory[];
  currencySymbol: string;
  restaurantName: string;
  tagline: string | null;
  hasRealPhotos: boolean;
}) {
  const [state, setState] = useState<Appearance>(initial);
  const [view, setView] = useState<"mobile" | "wide">("mobile");
  const [placeholder, setPlaceholder] = useState(!hasRealPhotos);
  const [pending, startTransition] = useTransition();

  const theme = getTheme(state.themeId);
  const resolved = useMemo(() => resolveTheme(state), [state]);
  const previewCategories = categories.length > 0 ? categories : SAMPLE_MENU;

  const dirty = (Object.keys(state) as (keyof Appearance)[]).some((k) => state[k] !== initial[k]);
  const hasOverrides = OVERRIDE_KEYS.some((k) => state[k] !== null);

  const textContrast = contrastRatio(resolved.colors.text, resolved.colors.background);
  const primaryContrast = contrastRatio(resolved.colors.primary, resolved.colors.background);

  function selectTheme(id: string) {
    // Al cambiar de tema se restauran sus colores y tipografías originales
    setState({
      themeId: id,
      colorBackground: null,
      colorText: null,
      colorPrimary: null,
      colorAccent: null,
      fontHeading: null,
      fontBody: null,
    });
  }

  function setField<K extends keyof Appearance>(key: K, value: Appearance[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function resetOverrides() {
    setState((s) => ({
      themeId: s.themeId,
      colorBackground: null,
      colorText: null,
      colorPrimary: null,
      colorAccent: null,
      fontHeading: null,
      fontBody: null,
    }));
  }

  function save() {
    startTransition(async () => {
      notify(await saveAppearanceAction(state));
    });
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Apariencia</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Elige el tema de tu carta y personalízalo. Lo que guardes lo verán tus clientes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-xs text-amber-700">Cambios sin guardar</span>}
          <button
            onClick={() => setState(initial)}
            disabled={!dirty || pending}
            className={secondaryButton}
          >
            Descartar
          </button>
          <button onClick={save} disabled={!dirty || pending} className={primaryButton}>
            {pending && <Spinner className="h-4 w-4" />}
            Guardar apariencia
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        {/* Controles */}
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Tema</h2>
            <div className="space-y-2">
              {THEME_LIST.map((t) => {
                const selected = t.id === state.themeId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectTheme(t.id)}
                    aria-pressed={selected}
                    className={`w-full rounded-xl bg-white p-3 text-left transition ${
                      selected
                        ? "ring-2 ring-neutral-900"
                        : "ring-1 ring-neutral-200 hover:ring-neutral-400"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">{t.name}</p>
                        <p className="text-xs text-neutral-500">{t.description}</p>
                      </div>
                      <div className="flex shrink-0 -space-x-1">
                        {[t.colors.background, t.colors.surface, t.colors.primary, t.colors.accent].map(
                          (c, i) => (
                            <span
                              key={i}
                              style={{ background: c }}
                              className="h-6 w-6 rounded-full ring-1 ring-black/10"
                            />
                          )
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              Este tema muestra las fotos en proporción {theme.image.aspect.replace("/", ":")}. Las fotos con
              otra proporción se ajustan con un recorte centrado, sin deformarse.
            </p>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                Personalización
              </h2>
              {hasOverrides && (
                <button
                  type="button"
                  onClick={resetOverrides}
                  className="text-xs text-neutral-600 underline"
                >
                  Restaurar tema original
                </button>
              )}
            </div>

            <div className="space-y-3 rounded-xl bg-white p-4 ring-1 ring-neutral-200">
              {COLOR_FIELDS.map(({ key, label, themeKey }) => {
                const overridden = state[key] !== null;
                const value = state[key] ?? theme.colors[themeKey];
                return (
                  <div key={key} className="flex items-center gap-3">
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => setField(key, e.target.value)}
                      aria-label={label}
                      className="h-9 w-12 cursor-pointer rounded border border-neutral-300 bg-white p-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs uppercase text-neutral-500">
                        {value}
                        {overridden && " · personalizado"}
                      </p>
                    </div>
                    {overridden && (
                      <button
                        type="button"
                        onClick={() => setField(key, null)}
                        title="Volver al color del tema"
                        aria-label={`Restablecer ${label}`}
                        className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}

              {textContrast < 4.5 && (
                <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-800">
                  El texto tiene poco contraste con el fondo y puede ser difícil de leer en el teléfono.
                </p>
              )}
              {primaryContrast < 3 && (
                <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-800">
                  El color principal casi no se distingue del fondo: los títulos y precios se verán apagados.
                </p>
              )}

              <div className="grid gap-3 pt-2 sm:grid-cols-2 lg:grid-cols-1">
                <div>
                  <label htmlFor="font-heading" className="block text-sm font-medium">
                    Tipografía de títulos
                  </label>
                  <select
                    id="font-heading"
                    value={state.fontHeading ?? ""}
                    onChange={(e) => setField("fontHeading", e.target.value || null)}
                    className={inputClass}
                  >
                    <option value="">Del tema ({FONT_OPTIONS[theme.fonts.heading].label})</option>
                    {FONT_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {FONT_OPTIONS[k].label} · {FONT_OPTIONS[k].kind}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="font-body" className="block text-sm font-medium">
                    Tipografía de textos
                  </label>
                  <select
                    id="font-body"
                    value={state.fontBody ?? ""}
                    onChange={(e) => setField("fontBody", e.target.value || null)}
                    className={inputClass}
                  >
                    <option value="">Del tema ({FONT_OPTIONS[theme.fonts.body].label})</option>
                    {FONT_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {FONT_OPTIONS[k].label} · {FONT_OPTIONS[k].kind}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Vista previa */}
        <div className="min-w-0 lg:sticky lg:top-6 lg:self-start">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Vista previa en vivo
            </h2>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-neutral-600">
                <input
                  type="checkbox"
                  checked={placeholder}
                  onChange={(e) => setPlaceholder(e.target.checked)}
                  className="h-4 w-4"
                />
                Simular fotos en platos sin foto
              </label>
              <div className="inline-flex rounded-md bg-neutral-100 p-0.5 text-xs">
                {(["mobile", "wide"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setView(v)}
                    aria-pressed={view === v}
                    className={`rounded px-3 py-1 ${
                      view === v ? "bg-white font-medium shadow-sm" : "text-neutral-600"
                    }`}
                  >
                    {v === "mobile" ? "Teléfono" : "Ancha"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:rounded-xl">
            <div className={view === "mobile" ? "mx-auto max-w-[390px]" : ""}>
              <MenuTheme resolved={resolved} className="overflow-hidden rounded-xl ring-1 ring-neutral-200">
                <div className="mt-container">
                  <header className="mt-header">
                    <h1 className="mt-header-name">{restaurantName}</h1>
                    {tagline && <p className="mt-header-tagline">{tagline}</p>}
                  </header>
                  <MenuBody
                    categories={previewCategories}
                    symbol={currencySymbol}
                    placeholderImages={placeholder}
                  />
                </div>
              </MenuTheme>
            </div>
          </div>

          {categories.length === 0 && (
            <p className="mt-2 text-xs text-neutral-500">
              Todavía no tienes platos visibles, así que la vista previa usa datos de ejemplo.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}