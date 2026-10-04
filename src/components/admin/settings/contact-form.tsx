//src/components/admin/settings/contact-form.tsx
"use client";

import { useState, useTransition } from "react";
import { saveContactAction } from "@/actions/settings";
import { notify } from "@/lib/notify";
import { inputClass } from "@/components/ui/styles";
import { SettingsCard, SaveButton } from "./settings-card";

type Values = {
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  instagram: string;
  facebook: string;
  website: string;
};

const FIELDS: {
  key: keyof Values;
  label: string;
  placeholder: string;
  type?: string;
  maxLength: number;
}[] = [
  { key: "address", label: "Dirección", placeholder: "Calle, número, sector, ciudad", maxLength: 160 },
  { key: "phone", label: "Teléfono", placeholder: "809-555-0100", type: "tel", maxLength: 30 },
  { key: "whatsapp", label: "WhatsApp", placeholder: "18095550100 (con código de país)", type: "tel", maxLength: 30 },
  { key: "email", label: "Correo", placeholder: "contacto@mirestaurante.com", type: "email", maxLength: 120 },
  { key: "instagram", label: "Instagram", placeholder: "@mirestaurante", maxLength: 100 },
  { key: "facebook", label: "Facebook", placeholder: "mirestaurante o enlace de la página", maxLength: 120 },
  { key: "website", label: "Sitio web", placeholder: "www.mirestaurante.com", maxLength: 200 },
];

export function ContactForm({ initial }: { initial: Values }) {
  const [values, setValues] = useState<Values>(initial);
  const [pending, startTransition] = useTransition();

  const dirty = (Object.keys(values) as (keyof Values)[]).some((k) => values[k] !== initial[k]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      notify(await saveContactAction(values));
    });
  }

  return (
    <SettingsCard
      title="Contacto y redes"
      description="Aparecen al final de la carta. Deja vacío lo que no uses."
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.key} className={f.key === "address" ? "sm:col-span-2" : ""}>
              <label htmlFor={`c-${f.key}`} className="block text-sm font-medium">
                {f.label}
              </label>
              <input
                id={`c-${f.key}`}
                type={f.type ?? "text"}
                value={values[f.key]}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                maxLength={f.maxLength}
                placeholder={f.placeholder}
                className={inputClass}
              />
            </div>
          ))}
        </div>

        <SaveButton pending={pending} dirty={dirty} />
      </form>
    </SettingsCard>
  );
}