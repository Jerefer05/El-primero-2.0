"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { getBrowserClient } from "@/lib/supabase";
import { formatPrice } from "@/data/products";
import { refreshStore } from "@/app/almacen/actions";
import {
  cardClass,
  inputClass,
  primaryButton,
  secondaryButton,
} from "@/components/almacen/styles";

type ZoneRow = {
  id: string;
  name: string;
  price: number;
  position: number;
  active: boolean;
};

// Zonas de envío con su costo, y desde qué monto el envío es gratis.
export default function ShippingPanel({ session }: { session: Session }) {
  const supabase = getBrowserClient();
  const [zones, setZones] = useState<ZoneRow[]>([]);
  const [freeFrom, setFreeFrom] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<{ id: string | null; name: string; price: string } | null>(
    null,
  );
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [zonesResult, settingsResult] = await Promise.all([
      supabase
        .from("shipping_zones")
        .select("id, name, price, position, active")
        .order("position")
        .order("name"),
      supabase.from("site_settings").select("free_shipping_from").eq("id", 1).maybeSingle(),
    ]);
    setLoading(false);
    if (zonesResult.error || settingsResult.error) {
      setNotice("No se pudieron cargar los envíos. Probá recargar la página.");
      return;
    }
    setZones(zonesResult.data as ZoneRow[]);
    setFreeFrom(String(settingsResult.data?.free_shipping_from ?? 0));
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial desde la base
    load();
  }, [load]);

  async function done(message: string) {
    await load();
    await refreshStore(session.access_token);
    setNotice(message);
  }

  async function saveFreeFrom(event: FormEvent) {
    event.preventDefault();
    setNotice("");
    const value = Number(freeFrom || 0);
    if (!Number.isInteger(value) || value < 0) return setNotice("Poné un número entero, sin puntos.");
    const { error: saveError } = await supabase
      .from("site_settings")
      .update({ free_shipping_from: value })
      .eq("id", 1);
    if (saveError) return setNotice("No se pudo guardar. Probá de nuevo.");
    await done(
      value > 0
        ? `Listo: el envío es gratis desde ${formatPrice(value)}.`
        : "Listo: el envío ya no es gratis por monto.",
    );
  }

  async function saveZone(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setError("");
    const name = editing.name.trim();
    const price = Number(editing.price);
    if (!name) return setError("Poné el nombre de la zona.");
    if (editing.price === "" || !Number.isInteger(price) || price < 0) {
      return setError("El costo tiene que ser un número entero, sin puntos (0 = sin cargo).");
    }
    const { error: saveError } = editing.id
      ? await supabase.from("shipping_zones").update({ name, price }).eq("id", editing.id)
      : await supabase.from("shipping_zones").insert({
          name,
          price,
          position: zones.reduce((max, zone) => Math.max(max, zone.position), 0) + 1,
        });
    if (saveError) return setError("No se pudo guardar la zona. Probá de nuevo.");
    setEditing(null);
    await done(`La zona ${name} se guardó.`);
  }

  async function toggle(zone: ZoneRow) {
    const { error: saveError } = await supabase
      .from("shipping_zones")
      .update({ active: !zone.active })
      .eq("id", zone.id);
    if (saveError) return setNotice("No se pudo guardar el cambio.");
    await done(zone.active ? `${zone.name} quedó pausada.` : `${zone.name} vuelve a estar disponible.`);
  }

  async function remove(zone: ZoneRow) {
    setConfirmDelete(null);
    const { error: saveError } = await supabase.from("shipping_zones").delete().eq("id", zone.id);
    if (saveError) return setNotice("No se pudo borrar la zona.");
    await done(`${zone.name} se borró.`);
  }

  if (loading) {
    return <p className="text-center text-sm text-[#2E2E2E]/70">Cargando envíos…</p>;
  }

  return (
    <div className="space-y-6">
      <form onSubmit={saveFreeFrom} className={`${cardClass} space-y-4`}>
        <div>
          <h2 className="font-serif text-xl">Envío gratis</h2>
          <p className="mt-1 text-xs text-[#2E2E2E]/70">
            Desde este monto el envío no se cobra, en cualquier zona. Poné 0 para
            que nunca sea gratis.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block min-w-48 flex-1 space-y-1.5 text-sm">
            <span>Monto (sin puntos, ej: 50000)</span>
            <input
              inputMode="numeric"
              value={freeFrom}
              onChange={(event) => setFreeFrom(event.target.value.replace(/\D/g, ""))}
              className={inputClass}
            />
          </label>
          <button type="submit" className={primaryButton}>
            Guardar
          </button>
        </div>
      </form>

      <section className={`${cardClass} space-y-4`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl">Zonas de envío</h2>
            <p className="mt-1 text-xs text-[#2E2E2E]/70">
              El cliente elige su zona al comprar y ve el costo antes de confirmar.
              Si no cargás ninguna, el envío queda “a coordinar”, como hasta ahora.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setError("");
              setEditing({ id: null, name: "", price: "" });
            }}
            className={secondaryButton}
          >
            Agregar zona
          </button>
        </div>

        {editing && (
          <form onSubmit={saveZone} className="grid gap-3 rounded-xl bg-white/60 p-4 sm:grid-cols-[1fr_160px_auto]">
            <label className="block space-y-1.5 text-sm">
              <span>Zona (ej: La Plata, CABA, Interior)</span>
              <input
                required
                maxLength={60}
                value={editing.name}
                onChange={(event) => setEditing({ ...editing, name: event.target.value })}
                className={inputClass}
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span>Costo (0 = sin cargo)</span>
              <input
                required
                inputMode="numeric"
                value={editing.price}
                onChange={(event) =>
                  setEditing({ ...editing, price: event.target.value.replace(/\D/g, "") })
                }
                className={inputClass}
              />
            </label>
            <div className="flex items-end gap-2">
              <button type="submit" className={primaryButton}>
                Guardar
              </button>
              <button type="button" onClick={() => setEditing(null)} className={secondaryButton}>
                Cancelar
              </button>
            </div>
            {error && <p className="text-sm text-red-700 sm:col-span-3">{error}</p>}
          </form>
        )}

        {zones.length === 0 ? (
          <p className="text-sm text-[#2E2E2E]/70">Todavía no hay zonas.</p>
        ) : (
          <ul className="divide-y divide-[#6E6353]/15">
            {zones.map((zone) => (
              <li key={zone.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                <p className="min-w-0 flex-1">
                  <span className="font-serif text-lg">{zone.name}</span>{" "}
                  <span className="text-[#2E2E2E]/70">
                    · {zone.price === 0 ? "Sin cargo" : formatPrice(zone.price)}
                    {!zone.active && " · Pausada (no se ofrece)"}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setEditing({ id: zone.id, name: zone.name, price: String(zone.price) });
                    }}
                    className={secondaryButton}
                  >
                    Editar
                  </button>
                  <button type="button" onClick={() => toggle(zone)} className={secondaryButton}>
                    {zone.active ? "Pausar" : "Activar"}
                  </button>
                  {confirmDelete === zone.id ? (
                    <button
                      type="button"
                      onClick={() => remove(zone)}
                      className="rounded-full bg-red-700 px-5 py-2 text-xs tracking-[0.16em] text-white uppercase"
                    >
                      ¿Seguro? Borrar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(zone.id)}
                      className={secondaryButton}
                    >
                      Borrar
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {notice && (
        <p className="rounded-xl bg-white/60 px-4 py-3 text-sm text-[#2E2E2E]">{notice}</p>
      )}
    </div>
  );
}
