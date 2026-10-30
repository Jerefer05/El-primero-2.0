"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [imageFailed, setImageFailed] = useState(false);
  const soldOut = product.inStock === false;

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/50 bg-white/40 backdrop-blur-sm shadow-whisper transition duration-500 hover:-translate-y-1 hover:shadow-soft">
      {/* Fondo #d7cbbe: se ve mientras carga y si la imagen falla */}
      <Link
        href={`/producto/${product.id}`}
        className="relative block aspect-[4/5] overflow-hidden bg-[#d7cbbe]"
      >
        {product.featured && (
          <span className="absolute top-3 left-3 z-10 rounded-full bg-[#6E6353] px-3 py-1 text-[0.65rem] tracking-[0.16em] text-[#f4eee6] uppercase shadow-whisper">
            Destacado
          </span>
        )}
        {!imageFailed && (
          <Image
            src={product.image}
            alt={product.alt}
            fill
            sizes="(min-width: 1024px) 20vw, (min-width: 640px) 45vw, 100vw"
            className="object-cover transition duration-700 group-hover:scale-[1.04]"
            onError={() => setImageFailed(true)}
          />
        )}
      </Link>
      <div className="space-y-4 px-5 py-5">
        <div className="space-y-2">
          <h3 className="font-serif text-xl text-[#2E2E2E]">
            <Link href={`/producto/${product.id}`} className="hover:underline underline-offset-4">
              {product.name}
            </Link>
          </h3>
          <p className="text-sm tracking-wide text-[#2E2E2E]/70">
            {product.priceLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={() => addItem(product)}
          disabled={soldOut}
          className="w-full rounded-full border border-[#6E6353] px-4 py-2.5 text-xs tracking-[0.16em] text-[#6E6353] uppercase transition hover:bg-[#6E6353] hover:text-[#f4eee6] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[#6E6353]"
        >
          {soldOut ? "Agotado" : "Agregar al carrito"}
        </button>
      </div>
    </article>
  );
}
