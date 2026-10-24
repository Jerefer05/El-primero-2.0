"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/#catalogo", label: "Catálogo" },
  { href: "/pedidos", label: "Pedidos" },
  { href: "/#contacto", label: "Contacto" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { itemCount, toggleCart } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b border-white/40 bg-white/30 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8">
        <Link
          href="/"
          className="font-serif text-2xl tracking-wide text-[#2E2E2E] md:text-[1.65rem]"
        >
          Tesoria
        </Link>

        <ul className="hidden items-center gap-10 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm font-medium tracking-[0.14em] text-[#2E2E2E]/80 uppercase transition hover:text-[#2E2E2E]"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleCart}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#2E2E2E]/25 text-[#2E2E2E]"
            aria-label={`Abrir carrito${itemCount ? `, ${itemCount} productos` : ""}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              className="h-5 w-5"
              aria-hidden
            >
              <path d="M6 7h15l-1.4 8.4a2 2 0 0 1-2 1.6H9.2a2 2 0 0 1-2-1.7L6 7Z" />
              <path d="M6 7 5.2 3.8A1 1 0 0 0 4.2 3H3" />
              <circle cx="9.5" cy="20" r="1" fill="currentColor" stroke="none" />
              <circle cx="17.5" cy="20" r="1" fill="currentColor" stroke="none" />
            </svg>
            {itemCount > 0 ? (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#6E6353] px-1 text-[10px] leading-none text-white">
                {itemCount}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#2E2E2E]/25 text-[#2E2E2E] md:hidden"
            aria-expanded={open}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">Menú</span>
            <span className="flex flex-col gap-1.5">
              <span
                className={`block h-px w-4 bg-[#2E2E2E] transition ${open ? "translate-y-[5px] rotate-45" : ""}`}
              />
              <span
                className={`block h-px w-4 bg-[#2E2E2E] transition ${open ? "opacity-0" : ""}`}
              />
              <span
                className={`block h-px w-4 bg-[#2E2E2E] transition ${open ? "-translate-y-[5px] -rotate-45" : ""}`}
              />
            </span>
          </button>
        </div>
      </nav>

      {open ? (
        <ul className="space-y-1 border-t border-white/40 px-5 py-4 md:hidden">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-2 py-3 text-sm tracking-[0.12em] text-[#2E2E2E] uppercase"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </header>
  );
}
