//src/components/admin/qr/qr-generator.tsx
"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type Props = {
  restaurantName: string;
  tagline: string | null;
  logoUrl: string | null;
};

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200";

function isValidUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function slugify(text: string) {
  return (
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "menu"
  );
}

export function QrGenerator({ restaurantName, tagline, logoUrl }: Props) {
  const [url, setUrl] = useState("");
  const [color, setColor] = useState("#111111");
  const [png, setPng] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // La dirección por defecto es la del sitio actual
  useEffect(() => {
    setUrl(`${window.location.origin}/`);
  }, []);

  const valid = isValidUrl(url);

  useEffect(() => {
    if (!valid) {
      setPng(null);
      setSvg(null);
      return;
    }
    let cancelled = false;
    setBusy(true);
    const timer = setTimeout(async () => {
      try {
        const opts = {
          errorCorrectionLevel: "M" as const,
          margin: 2,
          color: { dark: color, light: "#ffffff" },
        };
        const [pngData, svgData] = await Promise.all([
          QRCode.toDataURL(url, { ...opts, width: 1024 }),
          QRCode.toString(url, { ...opts, type: "svg" }),
        ]);
        if (!cancelled) {
          setPng(pngData);
          setSvg(svgData);
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [url, color, valid]);

  const fileBase = `qr-${slugify(restaurantName)}`;

  function downloadSvg() {
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `${fileBase}.svg`;
    a.click();
    URL.revokeObjectURL(href);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
      {/* Controles */}
      <div className="space-y-5 rounded-xl border border-neutral-200 bg-white p-5 print:hidden">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Dirección del menú
          </label>
          <input
            className={inputClass}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://mirestaurante.com/"
            spellCheck={false}
          />
          {!valid && url !== "" && (
            <p className="mt-1 text-xs text-red-600">
              Escribe una dirección completa que empiece por http:// o https://
            </p>
          )}
          <p className="mt-1 text-xs text-neutral-500">
            Mientras trabajas en tu computadora aparecerá localhost. Antes de
            imprimir, escribe la dirección real y pública de tu menú.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Color del QR</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border border-neutral-300 bg-white p-1"
            />
            <span className="text-sm text-neutral-600">{color}</span>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Usa un color oscuro sobre el fondo blanco para que se escanee bien.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <a
            href={png ?? undefined}
            download={`${fileBase}.png`}
            aria-disabled={!png}
            className={`rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white ${
              png ? "hover:bg-neutral-700" : "pointer-events-none opacity-40"
            }`}
          >
            Descargar PNG
          </a>
          <button
            type="button"
            onClick={downloadSvg}
            disabled={!svg}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-40"
          >
            Descargar SVG
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!png}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-40"
          >
            Imprimir tarjeta
          </button>
        </div>
      </div>

      {/* Tarjeta imprimible */}
      <div className="flex justify-center">
        <div
          id="qr-print"
          className="w-full max-w-[380px] rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm"
        >
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              className="mx-auto mb-4 h-16 w-16 rounded-full object-cover"
            />
          )}
          <h2 className="text-xl font-semibold text-neutral-900">
            {restaurantName}
          </h2>
          {tagline && (
            <p className="mt-1 text-sm text-neutral-500">{tagline}</p>
          )}

          <div className="relative mx-auto mt-5 aspect-square w-full max-w-[280px]">
            {png ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={png} alt="Código QR del menú" className="h-full w-full" />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-lg bg-neutral-100 text-xs text-neutral-400">
                {valid ? "Generando…" : "Escribe una dirección válida"}
              </div>
            )}
            {busy && png && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 print:hidden">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-800" />
              </div>
            )}
          </div>

          <p className="mt-5 text-sm font-medium text-neutral-800">
            Escanea para ver nuestro menú
          </p>
        </div>
      </div>

      {/* Al imprimir solo se muestra la tarjeta */}
      <style>{`
        @media print {
          @page { margin: 12mm; }
          html, body { height: auto !important; overflow: visible !important; background: #fff !important; }
          body * { visibility: hidden !important; }
          #qr-print, #qr-print * { visibility: visible !important; }
          #qr-print {
            position: absolute !important;
            left: 50%; top: 0;
            transform: translateX(-50%);
            border: none !important;
            box-shadow: none !important;
            max-width: 480px !important;
          }
        }
      `}</style>
    </div>
  );
}