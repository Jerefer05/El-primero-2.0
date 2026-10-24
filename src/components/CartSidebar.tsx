"use client";

import Image from "next/image";
import { formatPrice } from "@/data/products";
import { STORE, whatsappLink } from "@/data/config";
import { useCart } from "@/context/CartContext";

export default function CartSidebar() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    increaseItem,
    decreaseItem,
    subtotal,
  } = useCart();

  const remaining = Math.max(0, STORE.freeShippingFrom - subtotal);
  const progress = Math.min(100, (subtotal / STORE.freeShippingFrom) * 100);
  const cashTotal = Math.round(subtotal * (1 - STORE.cashDiscount));

  function buildMessage() {
    const lines = items.map(
      (item) =>
        `• ${item.quantity} × ${item.name} — ${formatPrice(item.price * item.quantity)}`,
    );
    return [
      `¡Hola ${STORE.name}! Quiero hacer este pedido:`,
      "",
      ...lines,
      "",
      `Total: ${formatPrice(subtotal)}`,
      `Abonando en efectivo (${Math.round(STORE.cashDiscount * 100)}% OFF): ${formatPrice(cashTotal)}`,
      "",
      "¿Coordinamos el pago y el envío? ¡Gracias!",
    ].join("\n");
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-[70] bg-black/30 transition-opacity ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeCart}
        aria-hidden={!isOpen}
      />
      <aside
        className={`fixed top-0 right-0 z-[80] flex h-full w-full max-w-md flex-col border-l border-[#6E6353]/15 bg-[#eaf0fa] shadow-soft transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isOpen}
        aria-label="Carrito de compras"
      >
        <div className="flex items-center justify-between border-b border-[#6E6353]/15 px-6 py-5">
          <h2 className="font-serif text-2xl text-[#6E6353]">Tu carrito</h2>
          <button
            type="button"
            onClick={closeCart}
            className="text-sm tracking-[0.12em] text-[#6E6353] uppercase"
            aria-label="Cerrar carrito"
          >
            Cerrar
          </button>
        </div>

        {items.length > 0 && (
          <div className="border-b border-[#6E6353]/10 px-6 py-4">
            <p className="text-xs text-[#2E2E2E]">
              {remaining === 0
                ? "¡Tenés envío gratis!"
                : `Te faltan ${formatPrice(remaining)} para el envío gratis`}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#2E2E2E]/10">
              <div
                className="h-full rounded-full bg-[#6E6353] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
          {items.length === 0 ? (
            <p className="text-sm text-[#8A887E]">
              Todavía no hay productos en el carrito.
            </p>
          ) : (
            items.map((item) => (
              <article
                key={item.id}
                className="flex gap-4 rounded-2xl border border-[#6E6353]/10 bg-white/70 p-3"
              >
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-[#d7cbbe]">
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-serif text-lg text-[#6E6353]">
                    {item.name}
                  </h3>
                  <p className="mt-1 text-sm text-[#2E2E2E]">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center rounded-full border border-[#6E6353]/30">
                      <button
                        type="button"
                        onClick={() => decreaseItem(item.id)}
                        aria-label={`Quitar una unidad de ${item.name}`}
                        className="h-7 w-7 text-lg leading-none text-[#6E6353]"
                      >
                        −
                      </button>
                      <span className="min-w-6 text-center text-sm text-[#2E2E2E]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => increaseItem(item.id)}
                        aria-label={`Agregar una unidad de ${item.name}`}
                        className="h-7 w-7 text-lg leading-none text-[#6E6353]"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-xs tracking-wide text-[#8A887E] underline-offset-2 hover:underline"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="border-t border-[#6E6353]/15 px-6 py-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#8A887E]">Subtotal</span>
            <span className="font-serif text-2xl text-[#2E2E2E]">
              {formatPrice(subtotal)}
            </span>
          </div>
          {items.length > 0 && (
            <p className="mt-1 text-right text-xs text-[#2E2E2E]/70">
              En efectivo ({Math.round(STORE.cashDiscount * 100)}% OFF):{" "}
              <strong>{formatPrice(cashTotal)}</strong>
            </p>
          )}
          {items.length === 0 ? (
            <button
              type="button"
              disabled
              className="mt-5 w-full cursor-not-allowed rounded-full border border-[#6E6353] bg-[#6E6353] px-6 py-3 text-sm tracking-[0.16em] text-[#f4eee6] uppercase opacity-40"
            >
              Finalizar Compra
            </button>
          ) : (
            <a
              href={whatsappLink(buildMessage())}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 block w-full rounded-full border border-[#6E6353] bg-[#6E6353] px-6 py-3 text-center text-sm tracking-[0.16em] text-[#f4eee6] uppercase transition hover:bg-transparent hover:text-[#6E6353]"
            >
              Finalizar por WhatsApp
            </a>
          )}
          {items.length > 0 && (
            <p className="mt-3 text-center text-xs text-[#2E2E2E]/60">
              Te abrimos WhatsApp con tu pedido armado para coordinar el pago y
              el envío.
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
