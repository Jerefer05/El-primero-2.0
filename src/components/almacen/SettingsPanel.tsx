"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { getBrowserClient } from "@/lib/supabase";
import { SETTINGS_COLUMNS, type SettingsRow } from "@/data/settings";
import { refreshStore } from "@/app/almacen/actions";
import {
  cardClass,
  inputClass,
  primaryButton,
  secondaryButton,
} from "@/components/almacen/styles";

type Section = "textos" | "contacto";

// Edita la fila única de `site_settings`: textos de la portada, "Nuestra
// esencia", el cartel de aviso, y los datos de pago y contacto.
export default function SettingsPanel({
  session,
  section,
}: {
  session: Session;
  section: Section;
}) {
  const supabase = getBrowserClient();
  const [row, setRow] = useState<SettingsRow | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select(SETTINGS_COLUMNS)
      .eq("id", 1)
      .maybeSingle()
      .then(({ data, error: loadError }) => {
        if (loadError || !data) {
          setError("No se pudieron cargar los datos. Probá recargar la página.");
          return;
        }
        setRow(data as SettingsRow);
      });
  }, [supabase]);

  if (!row) {
    return (
      <p className="text-center text-sm text-[#2E2E2E]/70">{error || "Cargando…"}</p>
    );
  }

  function update<K extends keyof SettingsRow>(key: K, value: SettingsRow[K]) {
    setRow((current) => (current ? { ...current, [key]: value } : current));
    setNotice("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!row) return;
    setError("");
    setNotice("");
    if (!row.hero_title.trim()) return setError("El título de la portada no puede quedar vacío.");
    if (row.banner_active && !row.banner_text.trim()) {
      return setError("Escribí el texto del cartel o apagalo.");
    }

    const values = row.about_values
      .map((value) => ({ title: value.title.trim(), description: value.description.trim() }))
      .filter((value) => value.title || value.description);

    setSaving(true);
    const { error: saveError } = await supabase
      .from("site_settings")
      .update({
        ...row,
        about_values: values,
        whatsapp_number: row.whatsapp_number.replace(/\D/g, ""),
        instagram_url: row.instagram_url.trim(),
        transfer_alias: row.transfer_alias.trim(),
        transfer_cbu: row.transfer_cbu.replace(/\s/g, ""),
        banner_text: row.banner_text.trim(),
      })
      .eq("id", 1);
    if (saveError) {
      setSaving(false);
      return setError("No se pudo guardar. Revisá los datos y probá de nuevo.");
    }
    await refreshStore(session.access_token);
    setSaving(false);
    setRow({ ...row, about_values: values });
    setNotice("Listo, se guardó. Ya se ve en la web (recargá la página para verlo).");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {section === "textos" ? (
        <>
          <Card title="Cartel de aviso" hint="Una franja arriba de toda la web. Ideal para promos: “Envíos gratis este finde”.">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={row.banner_active}
                onChange={(event) => update("banner_active", event.target.checked)}
                className="h-4 w-4 accent-[#6E6353]"
              />
              Mostrar el cartel
            </label>
            <Field label="Texto del cartel (hasta 200 letras)">
              <input
                maxLength={200}
                value={row.banner_text}
                onChange={(event) => update("banner_text", event.target.value)}
                placeholder="Ej: Envíos gratis este fin de semana"
                className={inputClass}
              />
            </Field>
          </Card>

          <Card title="Portada" hint="Lo primero que se ve al entrar a la web.">
            <Field label="Frase chiquita de arriba">
              <input
                value={row.hero_kicker}
                onChange={(event) => update("hero_kicker", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Título grande">
              <input
                required
                value={row.hero_title}
                onChange={(event) => update("hero_title", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Texto debajo del título">
              <textarea
                rows={3}
                value={row.hero_subtitle}
                onChange={(event) => update("hero_subtitle", event.target.value)}
                className={inputClass}
              />
            </Field>
          </Card>

          <Card title="Sobre nosotros (“Nuestra esencia”)" hint="La sección con las tarjetas que cuentan quiénes son.">
            <Field label="Título">
              <input
                value={row.about_title}
                onChange={(event) => update("about_title", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Frase debajo del título">
              <input
                value={row.about_subtitle}
                onChange={(event) => update("about_subtitle", event.target.value)}
                className={inputClass}
              />
            </Field>
            {row.about_values.map((value, index) => (
              <div key={index} className="space-y-2 rounded-xl bg-white/50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs tracking-[0.14em] text-[#6E6353] uppercase">
                    Tarjeta {index + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      update(
                        "about_values",
                        row.about_values.filter((_, i) => i !== index),
                      )
                    }
                    className="text-xs text-[#6E6353] underline"
                  >
                    Quitar
                  </button>
                </div>
                <input
                  placeholder="Título"
                  value={value.title}
                  onChange={(event) =>
                    update(
                      "about_values",
                      row.about_values.map((item, i) =>
                        i === index ? { ...item, title: event.target.value } : item,
                      ),
                    )
                  }
                  className={inputClass}
                />
                <textarea
                  rows={2}
                  placeholder="Texto"
                  value={value.description}
                  onChange={(event) =>
                    update(
                      "about_values",
                      row.about_values.map((item, i) =>
                        i === index ? { ...item, description: event.target.value } : item,
                      ),
                    )
                  }
                  className={inputClass}
                />
              </div>
            ))}
            {row.about_values.length < 6 && (
              <button
                type="button"
                onClick={() =>
                  update("about_values", [...row.about_values, { title: "", description: "" }])
                }
                className={secondaryButton}
              >
                Agregar tarjeta
              </button>
            )}
          </Card>
        </>
      ) : (
        <>
          <Card title="Datos para transferir" hint="Salen en el comprobante que recibe el cliente cuando elige transferencia.">
            <Field label="Alias">
              <input
                value={row.transfer_alias}
                onChange={(event) => update("transfer_alias", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="CBU o CVU (opcional)">
              <input
                inputMode="numeric"
                value={row.transfer_cbu}
                onChange={(event) => update("transfer_cbu", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Titular de la cuenta (opcional)">
              <input
                value={row.transfer_holder}
                onChange={(event) => update("transfer_holder", event.target.value)}
                className={inputClass}
              />
            </Field>
          </Card>

          <Card title="Contacto" hint="El botón de WhatsApp, el pie de página y el comprobante usan estos datos.">
            <Field label="WhatsApp (con 549 y característica, sin + ni espacios. Ej: 5491122334455)">
              <input
                inputMode="numeric"
                maxLength={15}
                value={row.whatsapp_number}
                onChange={(event) =>
                  update("whatsapp_number", event.target.value.replace(/\D/g, ""))
                }
                className={inputClass}
              />
            </Field>
            {row.whatsapp_number && (
              <a
                href={`https://wa.me/${row.whatsapp_number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm text-[#6E6353] underline"
              >
                Probar este número en WhatsApp
              </a>
            )}
            <Field label="Instagram (link completo, vacío = no se muestra)">
              <input
                type="url"
                placeholder="https://instagram.com/tesoria"
                value={row.instagram_url}
                onChange={(event) => update("instagram_url", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Horario de atención">
              <input
                value={row.hours}
                onChange={(event) => update("hours", event.target.value)}
                className={inputClass}
              />
            </Field>
          </Card>
        </>
      )}

      {error && <p className="text-sm text-red-700">{error}</p>}
      {notice && (
        <p className="rounded-xl bg-white/60 px-4 py-3 text-sm text-[#2E2E2E]">{notice}</p>
      )}
      <button type="submit" disabled={saving} className={primaryButton}>
        {saving ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}

function Card({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section className={`${cardClass} space-y-4`}>
      <div>
        <h2 className="font-serif text-xl">{title}</h2>
        <p className="mt-1 text-xs text-[#2E2E2E]/70">{hint}</p>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span>{label}</span>
      {children}
    </label>
  );
}
