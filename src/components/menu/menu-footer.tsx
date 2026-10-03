//src/components/menu/menu-footer.tsx
import { Fragment } from "react";
import { groupHours, hasOpenDay, type HourRow } from "@/lib/hours";
import { mailUrl, socialUrl, telUrl, webUrl, whatsappUrl } from "@/lib/links";

export function MenuFooter({
  address,
  phone,
  whatsapp,
  email,
  instagram,
  facebook,
  website,
  hours,
}: {
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  facebook: string | null;
  website: string | null;
  hours: HourRow[];
}) {
  const rows = hasOpenDay(hours) ? groupHours(hours) : [];

  const tel = telUrl(phone);
  const wa = whatsappUrl(whatsapp);
  const mail = mailUrl(email);

  const links = [
    { label: "Instagram", href: socialUrl("https://instagram.com/", instagram) },
    { label: "Facebook", href: socialUrl("https://facebook.com/", facebook) },
    { label: "Sitio web", href: webUrl(website) },
  ].filter((l): l is { label: string; href: string } => Boolean(l.href));

  const hasContact = Boolean(address || tel || wa || mail);

  if (rows.length === 0 && !hasContact && links.length === 0) return null;

  return (
    <footer className="mt-footer">
      <div className="mt-footer-inner">
        {rows.length > 0 && (
          <section>
            <h2>Horario</h2>
            <dl className="mt-hours">
              {rows.map((r) => (
                <Fragment key={r.label}>
                  <dt>{r.label}</dt>
                  <dd>{r.text}</dd>
                </Fragment>
              ))}
            </dl>
          </section>
        )}

        {(hasContact || links.length > 0) && (
          <section>
            <h2>Contacto</h2>
            {hasContact && (
              <ul className="mt-contact">
                {address && <li>{address}</li>}
                {tel && (
                  <li>
                    Tel. <a href={tel}>{phone}</a>
                  </li>
                )}
                {wa && (
                  <li>
                    WhatsApp{" "}
                    <a href={wa} target="_blank" rel="noopener noreferrer">
                      {whatsapp}
                    </a>
                  </li>
                )}
                {mail && (
                  <li>
                    <a href={mail}>{email}</a>
                  </li>
                )}
              </ul>
            )}
            {links.length > 0 && (
              <ul className="mt-footer-links">
                {links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} target="_blank" rel="noopener noreferrer">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </footer>
  );
}