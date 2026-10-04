//src/components/admin/settings/identity-form.tsx
"use client";

import { useState, useTransition } from "react";
import { saveIdentityAction } from "@/actions/settings";
import { notify } from "@/lib/notify";
import type { ImageInfo } from "@/lib/media";
import { inputClass } from "@/components/ui/styles";
import { ImageField, type AspectOption } from "@/components/admin/dishes/image-field";
import { SettingsCard, SaveButton } from "./settings-card";

const LOGO_ASPECTS: AspectOption[] = [{ label: "1:1", value: 1 }];
const COVER_ASPECTS: AspectOption[] = [
  { label: "16:7", value: 16 / 7 },
  { label: "16:9", value: 16 / 9 },
  { label: "3:1", value: 3 },
];

type Initial = {
  name: string;
  tagline: string;
  description: string;
  logo: ImageInfo | null;
  cover: ImageInfo | null;
};

export function IdentityForm({ initial }: { initial: Initial }) {
  const [name, setName] = useState(initial.name);
  const [tagline, setTagline] = useState(initial.tagline);
  const [description, setDescription] = useState(initial.description);
  const [logo, setLogo] = useState<ImageInfo | null>(initial.logo);
  const [cover, setCover] = useState<ImageInfo | null>(initial.cover);
  const [pending, startTransition] = useTransition();

  const dirty =
    name !== initial.name ||
    tagline !== initial.tagline ||
    description !== initial.description ||
    logo?.id !== initial.logo?.id ||
    cover?.id !== initial.cover?.id;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      notify(
        await saveIdentityAction({
          name,
          tagline,
          description,
          logoId: logo?.id ?? null,
          coverId: cover?.id ?? null,
        })
      );
    });
  }

  return (
    <SettingsCard
      title="Identidad"
      description="Lo primero que ven tus clientes al abrir la carta."
    >
      <form onSubmit={submit} className="space-y-5">
        <ImageField
          label="Logo"
          hint="Se muestra en círculo sobre la portada. Usa una imagen cuadrada de al menos 400 px."
          aspects={LOGO_ASPECTS}
          round
          previewWidth="w-28"
          uploadLabel="Subir logo"
          value={logo}
          onChange={setLogo}
        />

        <ImageField
          label="Portada"
          hint="Banner horizontal en la parte de arriba de la carta. Recomendado: una foto del local o de tu mejor plato."
          aspects={COVER_ASPECTS}
          previewWidth="w-56"
          uploadLabel="Subir portada"
          value={cover}
          onChange={setCover}
        />

        <div>
          <label htmlFor="s-name" className="block text-sm font-medium">
            Nombre del restaurante
          </label>
          <input
            id="s-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={80}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="s-tagline" className="block text-sm font-medium">
            Eslogan <span className="font-normal text-neutral-500">(opcional)</span>
          </label>
          <input
            id="s-tagline"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            maxLength={120}
            placeholder="Ej: Sabores que se disfrutan"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="s-description" className="block text-sm font-medium">
            Descripción <span className="font-normal text-neutral-500">(opcional)</span>
          </label>
          <textarea
            id="s-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={400}
            placeholder="Cuéntale a tus clientes quién eres, en una o dos frases."
            className={inputClass}
          />
        </div>

        <SaveButton pending={pending} dirty={dirty} />
      </form>
    </SettingsCard>
  );
}