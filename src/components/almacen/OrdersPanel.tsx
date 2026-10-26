"use client";

import { useCallback, useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabase";
import { formatPrice } from "@/data/products";
import { STORE } from "@/data/config";
import {
  PAYMENT_LABELS,
  SHIPPING_LABELS,
  toWhatsappNumber,
  type OrderLine,
  type OrderTotals,
  type PaymentMethod,
  type ShippingMethod,
} from "@/lib/order";
import { cardClass, inputClass, secondaryButton } from "@/components/almacen/styles";

export const STATUSES = [
  { value: "nuevo", label: "Nuevo", color: "bg-amber-100 text-amber-900" },
  { value: "pagado", label: "Pagado", color: "bg-sky-100 text-sky-900" },
  { value: "enviado", label: "Enviado", color: "bg-violet-100 text-violet-900" },
  { value: "entregado", label: "Entregado", color: "bg-emerald-100 text-emerald-900" },
  { value: "cancelado", label: "Cancelado", color: "bg-stone-200 text-stone-700" },
] as const;

export type Status = (typeof STATUSES)[number]["value"];

export type OrderRow = {
  number: string;
  created_at: string;
  status: Status;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address: string;
  city: string;
  notes: string;
  shipping: ShippingMethod;
  payment: PaymentMethod;
  coupon: string | null;
  lines: OrderLine[];
  totals: OrderTotals;
  total: number;
  completed_at: string | null;
};

// "pendientes" = todo lo que todavía requiere hacer algo
type Filter = "pendientes" | "todos" | Status;

export const ORDER_COLUMNS =
  "number, created_at, completed_at, status, customer_name, customer_email, customer_phone, address, city, notes, shipping, payment, coupon, lines, totals, total";

export function statusInfo(status: Status) {
  return STATUSES.find((item) => item.value === status) ?? STATUSES[0];
}

export default function OrdersPanel() {
  const supabase = getBrowserClient();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("pendientes");
  const [notice, setNotice] = useState("");

  const loadOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(ORDER_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(200);
    setLoading(false);
    if (error) {
      setNotice("No se pudieron cargar los pedidos. Probá recargar la página.");
      return;
    }
    setOrders(data as OrderRow[]);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial desde la base
    loadOrders();
  }, [loadOrders]);

  async function changeStatus(order: OrderRow, status: Status) {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("number", order.number);
    if (error) {
      setNotice("No se pudo cambiar el estado. Probá de nuevo.");
      return;
    }
    setOrders((current) =>
      current.map((item) => (item.number === order.number ? { ...item, status } : item)),
    );
    setNotice(`El pedido ${order.number} quedó como “${statusInfo(status).label}”.`);
  }

  const visible = orders.filter((order) => {
    if (filter === "todos") return true;
    if (filter === "pendientes") return ["nuevo", "pagado"].includes(order.status);
    return order.status === filter;
  });

  const count = (status: Status) => orders.filter((order) => order.status === status).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#2E2E2E]/75">
          {count("nuevo")} nuevos · {count("pagado")} pagados sin enviar
        </p>
        <div className="flex gap-3">
          <select
            aria-label="Filtrar pedidos"
            value={filter}
            onChange={(event) => setFilter(event.target.value as Filter)}
            className={`${inputClass} w-auto`}
          >
            <option value="pendientes">Por hacer (nuevos y pagados)</option>
            <option value="todos">Todos</option>
            {STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label} ({count(status.value)})
              </option>
            ))}
          </select>
          <button type="button" onClick={loadOrders} className={secondaryButton}>
            Actualizar
          </button>
        </div>
      </div>

      {notice && (
        <p className="rounded-xl bg-white/60 px-4 py-3 text-sm text-[#2E2E2E]">{notice}</p>
      )}

      {loading ? (
        <p className="text-center text-sm text-[#2E2E2E]/70">Cargando pedidos…</p>
      ) : visible.length === 0 ? (
        <p className={`${cardClass} text-center text-sm text-[#2E2E2E]/75`}>
          {orders.length === 0
            ? "Todavía no hay pedidos. Cuando alguien compre en la web, aparece acá."
            : "No hay pedidos en esta lista."}
        </p>
      ) : (
        <ul className="space-y-4">
          {visible.map((order) => (
            <OrderCard key={order.number} order={order} onStatus={changeStatus} />
          ))}
        </ul>
      )}
    </div>
  );
}

function OrderCard({
  order,
  onStatus,
}: {
  order: OrderRow;
  onStatus: (order: OrderRow, status: Status) => void;
}) {
  const info = statusInfo(order.status);
  const date = new Date(order.created_at).toLocaleString("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const firstName = order.customer_name.split(" ")[0];
  const whatsapp = `https://wa.me/${toWhatsappNumber(order.customer_phone)}`;
  const message =
    order.status === "enviado"
      ? `¡Hola ${firstName}! Tu pedido ${order.number} de ${STORE.name} ya está en camino 🚚✨ ¡Gracias por tu compra!`
      : `¡Hola ${firstName}! Te escribimos de ${STORE.name} por tu pedido ${order.number}.`;

  return (
    <li className={`${cardClass} space-y-4 !py-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-serif text-lg">{order.customer_name}</p>
          <p className="text-xs text-[#2E2E2E]/70">
            {order.number} · {date}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${info.color}`}>
          {info.label}
        </span>
      </div>

      <ul className="space-y-1 text-sm">
        {order.lines.map((line) => (
          <li key={line.id} className="flex justify-between gap-3">
            <span>
              {line.quantity} × {line.name}
            </span>
            <span className="text-[#2E2E2E]/75">{formatPrice(line.price * line.quantity)}</span>
          </li>
        ))}
        {order.totals.discount > 0 && (
          <li className="flex justify-between gap-3 text-[#2E2E2E]/75">
            <span>Descuento {order.totals.discountLabel}</span>
            <span>−{formatPrice(order.totals.discount)}</span>
          </li>
        )}
        <li className="flex justify-between gap-3 border-t border-[#6E6353]/15 pt-1 font-semibold">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </li>
      </ul>

      <dl className="grid gap-1 text-sm text-[#2E2E2E]/85 sm:grid-cols-2">
        <div>📞 {order.customer_phone}</div>
        <div className="break-all">✉️ {order.customer_email}</div>
        <div>💳 {PAYMENT_LABELS[order.payment]}</div>
        <div>
          🚚 {SHIPPING_LABELS[order.shipping]}
          {order.shipping === "envio" && ` · ${order.address}, ${order.city}`}
        </div>
        {order.notes && <div className="sm:col-span-2">📝 {order.notes}</div>}
      </dl>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span>Estado:</span>
          <select
            value={order.status}
            onChange={(event) => onStatus(order, event.target.value as Status)}
            className={`${inputClass} w-auto !py-1.5`}
          >
            {STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>
        <a
          href={`${whatsapp}?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={secondaryButton}
        >
          {order.status === "enviado" ? "Avisar envío por WhatsApp" : "Escribirle por WhatsApp"}
        </a>
      </div>
    </li>
  );
}
