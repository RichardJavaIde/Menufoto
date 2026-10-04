//src/components/admin/settings/currency-form.tsx
"use client";

import { useState, useTransition } from "react";
import { saveCurrencyAction } from "@/actions/settings";
import { notify } from "@/lib/notify";
import { formatPrice } from "@/lib/format";
import { inputClass } from "@/components/ui/styles";
import { SettingsCard, SaveButton } from "./settings-card";

const PRESETS = [
  { label: "Peso dominicano", code: "DOP", symbol: "RD$" },
  { label: "Dólar estadounidense", code: "USD", symbol: "US$" },
  { label: "Euro", code: "EUR", symbol: "€" },
  { label: "Peso mexicano", code: "MXN", symbol: "MX$" },
  { label: "Peso colombiano", code: "COP", symbol: "COL$" },
];

export function CurrencyForm({ initial }: { initial: { code: string; symbol: string } }) {
  const [code, setCode] = useState(initial.code);
  const [symbol, setSymbol] = useState(initial.symbol);
  const [pending, startTransition] = useTransition();

  const dirty = code !== initial.code || symbol !== initial.symbol;
  const presetValue = PRESETS.find((p) => p.code === code && p.symbol === symbol)?.code ?? "";

  function choosePreset(presetCode: string) {
    const preset = PRESETS.find((p) => p.code === presetCode);
    if (!preset) return;
    setCode(preset.code);
    setSymbol(preset.symbol);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      notify(await saveCurrencyAction({ currencyCode: code, currencySymbol: symbol }));
    });
  }

  return (
    <SettingsCard title="Moneda" description="Se usa para mostrar los precios en el panel y en la carta.">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="m-preset" className="block text-sm font-medium">
            Moneda habitual
          </label>
          <select
            id="m-preset"
            value={presetValue}
            onChange={(e) => choosePreset(e.target.value)}
            className={inputClass}
          >
            <option value="">Personalizada</option>
            {PRESETS.map((p) => (
              <option key={p.code} value={p.code}>
                {p.label} ({p.symbol})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="m-symbol" className="block text-sm font-medium">
              Símbolo
            </label>
            <input
              id="m-symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              required
              maxLength={6}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="m-code" className="block text-sm font-medium">
              Código (3 letras)
            </label>
            <input
              id="m-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              maxLength={3}
              className={inputClass}
            />
          </div>
        </div>

        <p className="text-sm text-neutral-500">
          Así se verán los precios: <strong>{formatPrice(35000, symbol.trim() || "RD$")}</strong>
        </p>

        <SaveButton pending={pending} dirty={dirty} />
      </form>
    </SettingsCard>
  );
}