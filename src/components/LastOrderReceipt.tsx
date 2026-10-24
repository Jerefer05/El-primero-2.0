"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import OrderReceipt from "@/components/OrderReceipt";
import { LAST_ORDER_KEY, type Order } from "@/lib/order";

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
