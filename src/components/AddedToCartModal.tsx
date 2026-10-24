"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { formatPrice } from "@/data/products";
import { useCart } from "@/context/CartContext";

export default function AddedToCartModal() {
  const { lastAdded, dismissAdded, openCart, itemCount, subtotal } = useCart();
  const [imageFailed, setImageFailed] = useState(false);
  const continueRef = useRef<HTMLButtonElement>(null);

  // Cada producto nuevo vuelve a intentar cargar su imagen
  useEffect(() => {
    setImageFailed(false);
  }, [lastAdded?.id]);

  // Cerrar con Escape y llevar el foco al botón "Seguir eligiendo"
  useEffect(() => {
    if (!lastAdded) return;

    continueRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismissAdded();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lastAdded, dismissAdded]);

  if (!lastAdded) return null;

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black/30 px-5"
      onClick={dismissAdded}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Producto agregado al carrito"
        onClick={(event) => event.stopPropagation()}
        className="animate-fade-in relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/60 bg-[#eaf0fa] shadow-soft"
      >
        <button
          type="button"
          onClick={dismissAdded}
          aria-label="Cerrar y seguir eligiendo"
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[#2E2E2E]/20 bg-white/80 text-xl leading-none text-[#2E2E2E] transition hover:bg-white"
        >
          ×
        </button>

        <div className="relative aspect-[4/3] bg-[#d7cbbe]">
          {!imageFailed && (
            <Image
              src={lastAdded.image}
              alt={lastAdded.alt}
              fill
              sizes="384px"
              className="object-cover"
              onError={() => setImageFailed(true)}
            />
          )}
        </div>

        <div className="space-y-5 px-6 py-6">
          <div>
            <p className="text-xs tracking-[0.18em] text-[#2E2E2E]/60 uppercase">
              Agregado al carrito
            </p>
            <h3 className="mt-2 font-serif text-2xl text-[#2E2E2E]">
              {lastAdded.name}
            </h3>
            <p className="mt-1 text-sm text-[#2E2E2E]/75">
              {lastAdded.quantity} × {formatPrice(lastAdded.price)}
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-[#2E2E2E]/10 pt-4 text-sm text-[#2E2E2E]">
            <span>
              {itemCount} {itemCount === 1 ? "producto" : "productos"} en tu
              carrito
            </span>
            <span className="font-serif text-lg">{formatPrice(subtotal)}</span>
          </div>

          <div className="flex flex-col gap-3">
            <button
              ref={continueRef}
              type="button"
              onClick={dismissAdded}
              className="w-full rounded-full border border-[#2E2E2E] px-6 py-3 text-xs tracking-[0.16em] text-[#2E2E2E] uppercase transition hover:bg-[#2E2E2E] hover:text-white"
            >
              Seguir eligiendo
            </button>
            <button
              type="button"
              onClick={() => {
                dismissAdded();
                openCart();
              }}
              className="w-full rounded-full border border-[#6E6353] bg-[#6E6353] px-6 py-3 text-xs tracking-[0.16em] text-white uppercase transition hover:bg-transparent hover:text-[#6E6353]"
            >
              Ver carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
