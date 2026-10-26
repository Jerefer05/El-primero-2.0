"use client";

import { useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabase";
import { formatPrice } from "@/data/products";
import { PAYMENT_LABELS, SHIPPING_LABELS } from "@/lib/order";
import {
  ORDER_COLUMNS,
  statusInfo,
  type OrderRow,
} from "@/components/almacen/OrdersPanel";
import { cardClass, inputClass, secondaryButton } from "@/components/almacen/styles";

// Pedidos ya terminados (entregados o cancelados), con la fecha en que
// entraron y la fecha en que se completaron.

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

// "2026-10" → "octubre 2026"
function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });
}

function monthKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// Cuánto tardó, en palabras simples
function elapsed(from: string, to: string | null) {
  if (!to) return "";
  const hours = Math.round((new Date(to).getTime() - new Date(from).getTime()) / 36e5);
  if (hours < 1) return "menos de 1 hora";
  if (hours < 48) return `${hours} h`;
  return `${Math.round(hours / 24)} días`;
}

export default function HistoryPanel() {
  const supabase = getBrowserClient();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [month, setMonth] = useState("todos");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("orders")
      .select(ORDER_COLUMNS)
      .in("status", ["entregado", "cancelado"])
      .order("completed_at", { ascending: false, nullsFirst: false })
      .limit(500)
      .then(({ data, error: loadError }) => {
        setLoading(false);
        if (loadError) {
          setError("No se pudo cargar el historial. Probá recargar la página.");
          return;
        }
        setOrders(data as OrderRow[]);
      });
  }, [supabase]);

  const months = [
    ...new Set(orders.map((order) => monthKey(order.completed_at ?? order.created_at))),
  ];
  const term = search.trim().toLowerCase();
  const visible = orders.filter((order) => {
    if (month !== "todos" && monthKey(order.completed_at ?? order.created_at) !== month) {
      return false;
    }
    if (!term) return true;
    return [order.customer_name, order.number, order.customer_phone, order.customer_email]
      .join(" ")
      .toLowerCase()
      .includes(term);
  });
  const delivered = visible.filter((order) => order.status === "entregado");
  const cancelled = visible.length - delivered.length;
  const sold = delivered.reduce((sum, order) => sum + order.total, 0);

  if (loading) {
    return <p className="text-center text-sm text-[#2E2E2E]/70">Cargando historial…</p>;
  }
  if (error) {
    return <p className="text-center text-sm text-red-700">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Entregados" value={String(delivered.length)} />
        <Stat label="Vendido (entregados)" value={formatPrice(sold)} />
        <Stat label="Cancelados" value={String(cancelled)} />
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          aria-label="Mes"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
          className={`${inputClass} w-auto`}
        >
          <option value="todos">Todos los meses</option>
          {months.map((key) => (
            <option key={key} value={key}>
              {monthLabel(key)}
            </option>
          ))}
        </select>
        <input
          type="search"
          placeholder="Buscar por cliente, teléfono o número"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className={`${inputClass} min-w-56 flex-1`}
        />
      </div>

      {visible.length === 0 ? (
        <p className={`${cardClass} text-center text-sm text-[#2E2E2E]/75`}>
          {orders.length === 0
            ? "Todavía no hay pedidos terminados. Cuando marques uno como “Entregado” o “Cancelado” en Pedidos, aparece acá."
            : "No hay pedidos con ese filtro."}
        </p>
      ) : (
        <ul className="divide-y divide-[#6E6353]/15 overflow-hidden rounded-2xl border border-white/50 bg-white/40 shadow-whisper backdrop-blur-sm">
          {visible.map((order) => {
            const info = statusInfo(order.status);
            const expanded = open === order.number;
            return (
              <li key={order.number} className="px-5 py-4 text-sm">
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setOpen(expanded ? null : order.number)}
                  className="grid w-full gap-2 text-left sm:grid-cols-[1fr_auto]"
                >
                  <div>
                    <p className="font-serif text-lg">{order.customer_name}</p>
                    <p className="text-xs text-[#2E2E2E]/70">
                      {order.number} · Entró: {formatDate(order.created_at)} ·{" "}
                      {order.status === "entregado" ? "Entregado" : "Cancelado"}:{" "}
                      {formatDate(order.completed_at)}
                      {order.completed_at &&
                        ` (${elapsed(order.created_at, order.completed_at)})`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 sm:justify-end">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${info.color}`}>
                      {info.label}
                    </span>
                    <span className="font-semibold">{formatPrice(order.total)}</span>
                  </div>
                </button>
                {expanded && (
                  <div className="mt-3 space-y-2 rounded-xl bg-white/50 p-4">
                    <ul className="space-y-1">
                      {order.lines.map((line) => (
                        <li key={line.id} className="flex justify-between gap-3">
                          <span>
                            {line.quantity} × {line.name}
                          </span>
                          <span className="text-[#2E2E2E]/75">
                            {formatPrice(line.price * line.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-[#2E2E2E]/80">
                      📞 {order.customer_phone} · 💳 {PAYMENT_LABELS[order.payment]} · 🚚{" "}
                      {SHIPPING_LABELS[order.shipping]}
                      {order.shipping === "envio" && ` · ${order.address}, ${order.city}`}
                    </p>
                    <p className="text-xs text-[#2E2E2E]/60">
                      Para cambiarle el estado, buscalo en la pestaña Pedidos con el filtro “Todos”.
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {visible.length > 0 && (
        <button type="button" onClick={() => window.print()} className={`${secondaryButton} print:hidden`}>
          Imprimir o guardar en PDF
        </button>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={`${cardClass} !py-4 text-center`}>
      <p className="text-xs tracking-[0.14em] text-[#2E2E2E]/70 uppercase">{label}</p>
      <p className="mt-1 font-serif text-2xl">{value}</p>
    </div>
  );
}
