"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { getBrowserClient } from "@/lib/supabase";
import { normalizeCoupon } from "@/lib/order";
import {
  cardClass,
  inputClass,
  primaryButton,
  secondaryButton,
} from "@/components/almacen/styles";

type CouponRow = {
  code: string;
  percent: number;
  active: boolean;
  expires_on: string | null;
  note: string;
};

function today() {
  // Fecha de hoy en Argentina, como "2026-10-26"
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

function formatDay(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export default function CouponsPanel() {
  const supabase = getBrowserClient();
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [uses, setUses] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [form, setForm] = useState({ code: "", percent: "", expires: "", note: "" });

  const load = useCallback(async () => {
    const [couponsResult, ordersResult] = await Promise.all([
      supabase
        .from("coupons")
        .select("code, percent, active, expires_on, note")
        .order("created_at", { ascending: false }),
      supabase.from("orders").select("coupon").not("coupon", "is", null).neq("status", "cancelado"),
    ]);
    setLoading(false);
    if (couponsResult.error) {
      setNotice("No se pudieron cargar los cupones. Probá recargar la página.");
      return;
    }
    setCoupons(couponsResult.data as CouponRow[]);
    const counts: Record<string, number> = {};
    for (const order of (ordersResult.data ?? []) as { coupon: string }[]) {
      counts[order.coupon] = (counts[order.coupon] ?? 0) + 1;
    }
    setUses(counts);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial desde la base
    load();
  }, [load]);

  async function create(event: FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");
    const code = normalizeCoupon(form.code);
    const percent = Number(form.percent);
    if (!/^[A-Z0-9]{3,20}$/.test(code)) {
      return setError("El código va de 3 a 20 letras o números, sin espacios ni símbolos.");
    }
    if (!Number.isInteger(percent) || percent < 1 || percent > 90) {
      return setError("El descuento tiene que ser un número entre 1 y 90.");
    }
    if (coupons.some((coupon) => coupon.code === code)) {
      return setError("Ya existe un cupón con ese código.");
    }
    setSaving(true);
    const { error: saveError } = await supabase.from("coupons").insert({
      code,
      percent,
      expires_on: form.expires || null,
      note: form.note.trim(),
    });
    setSaving(false);
    if (saveError) return setError("No se pudo crear el cupón. Probá de nuevo.");
    setForm({ code: "", percent: "", expires: "", note: "" });
    setNotice(`Listo, el cupón ${code} ya funciona en la tienda.`);
    await load();
  }

  async function toggle(coupon: CouponRow) {
    const { error: saveError } = await supabase
      .from("coupons")
      .update({ active: !coupon.active })
      .eq("code", coupon.code);
    if (saveError) return setNotice("No se pudo guardar el cambio.");
    setNotice(
      coupon.active
        ? `${coupon.code} quedó apagado: ya no se puede usar.`
        : `${coupon.code} vuelve a funcionar.`,
    );
    await load();
  }

  async function remove(coupon: CouponRow) {
    setConfirmDelete(null);
    const { error: saveError } = await supabase.from("coupons").delete().eq("code", coupon.code);
    if (saveError) return setNotice("No se pudo borrar el cupón.");
    setNotice(`${coupon.code} se borró. Los pedidos que ya lo usaron no cambian.`);
    await load();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={create} className={`${cardClass} grid gap-4 sm:grid-cols-2`}>
        <div className="sm:col-span-2">
          <h2 className="font-serif text-xl">Nuevo cupón</h2>
          <p className="mt-1 text-xs text-[#2E2E2E]/70">
            El cliente lo escribe al finalizar la compra. No se suma al descuento
            en efectivo: se aplica el mayor.
          </p>
        </div>
        <label className="block space-y-1.5 text-sm">
          <span>Código (ej: VERANO20)</span>
          <input
            required
            maxLength={20}
            value={form.code}
            onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}
            className={`${inputClass} uppercase`}
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span>Descuento en % (ej: 20)</span>
          <input
            required
            inputMode="numeric"
            maxLength={2}
            value={form.percent}
            onChange={(event) => setForm({ ...form, percent: event.target.value.replace(/\D/g, "") })}
            className={inputClass}
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span>Vence (opcional, vale hasta ese día inclusive)</span>
          <input
            type="date"
            min={today()}
            value={form.expires}
            onChange={(event) => setForm({ ...form, expires: event.target.value })}
            className={inputClass}
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span>Nota para vos (opcional)</span>
          <input
            maxLength={120}
            placeholder="Ej: promo de Instagram"
            value={form.note}
            onChange={(event) => setForm({ ...form, note: event.target.value })}
            className={inputClass}
          />
        </label>
        {error && <p className="text-sm text-red-700 sm:col-span-2">{error}</p>}
        <div className="sm:col-span-2">
          <button type="submit" disabled={saving} className={primaryButton}>
            {saving ? "Creando…" : "Crear cupón"}
          </button>
        </div>
      </form>

      {notice && (
        <p className="rounded-xl bg-white/60 px-4 py-3 text-sm text-[#2E2E2E]">{notice}</p>
      )}

      {loading ? (
        <p className="text-center text-sm text-[#2E2E2E]/70">Cargando cupones…</p>
      ) : coupons.length === 0 ? (
        <p className={`${cardClass} text-center text-sm text-[#2E2E2E]/75`}>
          Todavía no hay cupones.
        </p>
      ) : (
        <ul className="divide-y divide-[#6E6353]/15 overflow-hidden rounded-2xl border border-white/50 bg-white/40 shadow-whisper backdrop-blur-sm">
          {coupons.map((coupon) => {
            const expired = coupon.expires_on !== null && coupon.expires_on < today();
            const working = coupon.active && !expired;
            return (
              <li key={coupon.code} className="flex flex-wrap items-center gap-4 px-5 py-4 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-lg">
                    {coupon.code} · {coupon.percent}% OFF
                  </p>
                  <p className="text-xs text-[#2E2E2E]/70">
                    {working ? "Funcionando" : expired ? "Vencido" : "Apagado"}
                    {coupon.expires_on && ` · Vence el ${formatDay(coupon.expires_on)}`}
                    {` · Usado en ${uses[coupon.code] ?? 0} pedidos`}
                    {coupon.note && ` · ${coupon.note}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => toggle(coupon)} className={secondaryButton}>
                    {coupon.active ? "Apagar" : "Prender"}
                  </button>
                  {confirmDelete === coupon.code ? (
                    <button
                      type="button"
                      onClick={() => remove(coupon)}
                      className="rounded-full bg-red-700 px-5 py-2 text-xs tracking-[0.16em] text-white uppercase"
                    >
                      ¿Seguro? Borrar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(coupon.code)}
                      className={secondaryButton}
                    >
                      Borrar
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
