"use client";

import type { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";

export default function AddToCartButton({
  product,
  soldOut,
}: {
  product: Product;
  soldOut: boolean;
}) {
  const { addItem } = useCart();
  return (
    <button
      type="button"
      onClick={() => addItem(product)}
      disabled={soldOut}
      className="w-full rounded-full border border-[#6E6353] bg-[#6E6353] px-6 py-3.5 text-sm tracking-[0.16em] text-[#f4eee6] uppercase transition hover:bg-transparent hover:text-[#6E6353] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {soldOut ? "Agotado" : "Agregar al carrito"}
    </button>
  );
}
