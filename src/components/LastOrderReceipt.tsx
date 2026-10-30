"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import OrderReceipt from "@/components/OrderReceipt";
import { LAST_ORDER_KEY, type Order } from "@/lib/order";
import { trackPurchase } from "@/lib/track";

const TRACKED_KEY = "tesoria-ultimo-pedido-medido";

// Avisa la venta a Analytics / Píxel una sola vez por pedido, aunque se
// recargue el comprobante.
function useTrackPurchase(order: Order | null) {
  useEffect(() => {
    if (!order) return;
    try {
      if (window.localStorage.getItem(TRACKED_KEY) === order.number) return;
      window.localStorage.setItem(TRACKED_KEY, order.number);
    } catch {
      // sin almacenamiento, se mide igual
    }
    // Los scripts de medición cargan después de la página: se espera un poco.
    const timer = setTimeout(
      () => trackPurchase({ number: order.number, total: order.totals.total, lines: order.lines }),
      1500,
    );
    return () => clearTimeout(timer);
  }, [order]);
}

function readSavedOrder() {
  try {
    return window.localStorage.getItem(LAST_ORDER_KEY) ?? "";
  } catch {
    return "";
  }
}

const noSubscription = () => () => {};

// El comprobante se guarda en el navegador del comprador al confirmar.
export default function LastOrderReceipt() {
  // null mientras se renderiza en el servidor, texto guardado ya en el navegador
  const saved = useSyncExternalStore(
    noSubscription,
    readSavedOrder,
    () => null,
  );
  const order = useMemo<Order | null>(() => {
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }, [saved]);

  useTrackPurchase(order);

  if (saved === null) return null;

  if (!order) {
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="text-sm text-[#2E2E2E]/75">
          No encontramos un pedido reciente en este dispositivo.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full border border-[#6E6353] px-6 py-3 text-sm tracking-[0.16em] text-[#6E6353] uppercase"
        >
          Volver a la tienda
        </Link>
      </div>
    );
  }

  return <OrderReceipt order={order} />;
}
