"use client";

import { useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabase";
import { formatPrice } from "@/data/products";
import type { OrderLine } from "@/lib/order";
import type { Status } from "@/components/almacen/OrdersPanel";
import { cardClass, inputClass } from "@/components/almacen/styles";

type SaleRow = {
  status: Status;
  total: number;
  lines: OrderLine[];
};

// Cuentan como venta los pedidos cobrados (pagados, enviados o entregados).
const PAID: Status[] = ["pagado", "enviado", "entregado"];

// Mes en Argentina como "2026-10"
function currentMonth() {
  return new Date()
    .toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" })
    .slice(0, 7);
}

function shiftMonth(key: string, delta: number) {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

// Desde el 1° a la medianoche de Argentina (UTC−3)
function monthStart(key: string) {
  return `${key}-01T00:00:00-03:00`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });
}

async function fetchMonth(key: string) {
  const { data, error } = await getBrowserClient()
    .from("orders")
    .select("status, total, lines")
    .gte("created_at", monthStart(key))
    .lt("created_at", monthStart(shiftMonth(key, 1)));
  if (error) throw error;
  return data as SaleRow[];
}

function summarize(orders: SaleRow[]) {
  const paid = orders.filter((order) => PAID.includes(order.status));
  const revenue = paid.reduce((sum, order) => sum + order.total, 0);
  const pending = orders.filter((order) => order.status === "nuevo");
  return {
    revenue,
    paidCount: paid.length,
    average: paid.length ? Math.round(revenue / paid.length) : 0,
    pendingCount: pending.length,
    pendingAmount: pending.reduce((sum, order) => sum + order.total, 0),
    cancelled: orders.filter((order) => order.status === "cancelado").length,
  };
}

// Productos más vendidos entre los pedidos cobrados
function topProducts(orders: SaleRow[]) {
  const byId = new Map<string, { name: string; units: number; amount: number }>();
  for (const order of orders) {
    if (!PAID.includes(order.status)) continue;
    for (const line of order.lines) {
      const item = byId.get(line.id) ?? { name: line.name, units: 0, amount: 0 };
      item.units += line.quantity;
      item.amount += line.price * line.quantity;
      byId.set(line.id, item);
    }
  }
  return [...byId.values()].sort((a, b) => b.units - a.units || b.amount - a.amount);
}

export default function SalesPanel() {
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState<{ month: string; current: SaleRow[]; previous: SaleRow[] } | null>(
    null,
  );
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchMonth(month), fetchMonth(shiftMonth(month, -1))])
      .then(([current, previous]) => {
        if (!cancelled) setData({ month, current, previous });
      })
      .catch(() => {
        if (!cancelled) setError("No se pudieron cargar las ventas. Probá recargar la página.");
      });
    return () => {
      cancelled = true;
    };
  }, [month]);

  const months = Array.from({ length: 12 }, (_, i) => shiftMonth(currentMonth(), -i));

  const header = (
    <select
      aria-label="Mes"
      value={month}
      onChange={(event) => setMonth(event.target.value)}
      className={`${inputClass} w-auto capitalize`}
    >
      {months.map((key) => (
        <option key={key} value={key}>
          {monthLabel(key)}
        </option>
      ))}
    </select>
  );

  if (error) return <p className="text-center text-sm text-red-700">{error}</p>;
  if (!data || data.month !== month) {
    return (
      <div className="space-y-6">
        {header}
        <p className="text-center text-sm text-[#2E2E2E]/70">Cargando ventas…</p>
      </div>
    );
  }

  const now = summarize(data.current);
  const before = summarize(data.previous);
  const change =
    before.revenue > 0 ? Math.round(((now.revenue - before.revenue) / before.revenue) * 100) : null;
  const top = topProducts(data.current).slice(0, 5);
  const maxUnits = top[0]?.units ?? 0;

  return (
    <div className="space-y-6">
      {header}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Vendido"
          value={formatPrice(now.revenue)}
          hint={
            change === null
              ? "Pagados, enviados y entregados"
              : `${change >= 0 ? "▲" : "▼"} ${Math.abs(change)}% vs. ${monthLabel(shiftMonth(month, -1))}`
          }
        />
        <Stat label="Pedidos cobrados" value={String(now.paidCount)} hint={`${now.cancelled} cancelados`} />
        <Stat label="Ticket promedio" value={formatPrice(now.average)} hint="Lo que gasta cada cliente" />
        <Stat
          label="Por cobrar"
          value={formatPrice(now.pendingAmount)}
          hint={`${now.pendingCount} pedidos nuevos sin pagar`}
        />
      </div>

      <section className={`${cardClass} space-y-4`}>
        <h2 className="font-serif text-xl">Lo más vendido</h2>
        {top.length === 0 ? (
          <p className="text-sm text-[#2E2E2E]/70">
            Todavía no hay ventas cobradas en {monthLabel(month)}. Cuando marques
            pedidos como “Pagado”, aparecen acá.
          </p>
        ) : (
          <ol className="space-y-3">
            {top.map((item, index) => (
              <li key={item.name} className="space-y-1 text-sm">
                <div className="flex justify-between gap-3">
                  <span>
                    {index + 1}. {item.name}
                  </span>
                  <span className="text-[#2E2E2E]/75">
                    {item.units} u. · {formatPrice(item.amount)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#6E6353]/10">
                  <div
                    className="h-full rounded-full bg-[#6E6353]"
                    style={{ width: `${(item.units / maxUnits) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className={`${cardClass} !py-4`}>
      <p className="text-xs tracking-[0.14em] text-[#2E2E2E]/70 uppercase">{label}</p>
      <p className="mt-1 font-serif text-2xl">{value}</p>
      <p className="mt-1 text-xs text-[#2E2E2E]/60">{hint}</p>
    </div>
  );
}
