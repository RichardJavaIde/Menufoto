//src/components/admin/settings/hours-form.tsx
"use client";

import { useState, useTransition } from "react";
import { Copy } from "lucide-react";
import { saveHoursAction } from "@/actions/settings";
import { notify } from "@/lib/notify";
import { DAY_NAMES } from "@/lib/hours";
import { inputClass, secondaryButton } from "@/components/ui/styles";
import { SettingsCard, SaveButton } from "./settings-card";

export type HourFormRow = {
  dayOfWeek: number;
  closed: boolean;
  opensAt: string;
  closesAt: string;
};

export function HoursForm({ initial }: { initial: HourFormRow[] }) {
  const [rows, setRows] = useState<HourFormRow[]>(initial);
  const [pending, startTransition] = useTransition();

  const dirty = JSON.stringify(rows) !== JSON.stringify(initial);

  function update(index: number, patch: Partial<HourFormRow>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function copyFirstToAll() {
    setRows((current) =>
      current.map((row) => ({
        ...row,
        closed: current[0].closed,
        opensAt: current[0].opensAt,
        closesAt: current[0].closesAt,
      }))
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      notify(
        await saveHoursAction({
          hours: rows.map((r) => ({
            dayOfWeek: r.dayOfWeek,
            closed: r.closed,
            opensAt: r.closed ? null : r.opensAt || null,
            closesAt: r.closed ? null : r.closesAt || null,
          })),
        })
      );
    });
  }

  return (
    <SettingsCard
      title="Horario"
      description="Es informativo: se muestra al final de la carta. Si cierras después de medianoche, escribe la hora normal (por ejemplo 02:00)."
    >
      <form onSubmit={submit} className="space-y-2">
        <ul className="divide-y divide-neutral-200">
          {rows.map((row, i) => (
            <li key={row.dayOfWeek} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <span className="w-24 font-medium">{DAY_NAMES[row.dayOfWeek]}</span>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!row.closed}
                  onChange={(e) => update(i, { closed: !e.target.checked })}
                  className="h-4 w-4"
                />
                Abierto
              </label>

              {row.closed ? (
                <span className="text-sm text-neutral-400">Cerrado</span>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <input
                    type="time"
                    value={row.opensAt}
                    onChange={(e) => update(i, { opensAt: e.target.value })}
                    required
                    aria-label={`${DAY_NAMES[row.dayOfWeek]}: hora de apertura`}
                    className={`${inputClass} mt-0 w-32`}
                  />
                  <span>a</span>
                  <input
                    type="time"
                    value={row.closesAt}
                    onChange={(e) => update(i, { closesAt: e.target.value })}
                    required
                    aria-label={`${DAY_NAMES[row.dayOfWeek]}: hora de cierre`}
                    className={`${inputClass} mt-0 w-32`}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>

        <button type="button" onClick={copyFirstToAll} className={secondaryButton}>
          <Copy className="h-4 w-4" />
          Copiar el horario del lunes a todos los días
        </button>

        <SaveButton pending={pending} dirty={dirty} />
      </form>
    </SettingsCard>
  );
}