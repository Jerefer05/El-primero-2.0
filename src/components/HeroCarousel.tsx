"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { heroSlides } from "@/data/products";

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % heroSlides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="relative h-screen min-h-[600px] w-full overflow-hidden bg-[#d7cbbe]">
      {heroSlides.map((slide, slideIndex) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          fill
          priority={slideIndex === 0}
          sizes="100vw"
          className={`object-cover object-center transition-opacity duration-1000 ${
            slideIndex === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Contenido perfectamente centrado (horizontal y vertical) */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-5 text-center">
        <p className="mb-6 text-xs tracking-[0.28em] text-white/80 uppercase">
          Velas artesanales · Home deco
        </p>
        <h1 className="title-hero font-serif text-4xl leading-tight sm:text-5xl md:text-7xl">
          Bienvenidos a Tesoria
        </h1>
        <p className="mt-7 max-w-2xl text-base leading-8 text-white/90 sm:text-lg">
          Ilumina tu hogar sin límites con nuestras velas recargables. Home deco,
          añade nostálgico.
        </p>
        <Link
          href="/#catalogo"
          className="mt-10 rounded-full border border-white px-8 py-3 text-sm tracking-[0.18em] text-white uppercase transition hover:bg-white hover:text-[#6E6353]"
        >
          Ver Catálogo
        </Link>
      </div>
    </section>
  );
}
