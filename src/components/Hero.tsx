import Link from "next/link";

// Portada: el cielo y las nubes del fondo se ven detrás del saludo
export default function Hero() {
  return (
    <section className="relative flex h-screen min-h-[600px] w-full flex-col items-center justify-center px-5 text-center">
      <p className="mb-6 text-xs tracking-[0.28em] text-[#2E2E2E]/70 uppercase">
        Velas artesanales · Home deco
      </p>
      <h1 className="title-soft font-serif text-4xl leading-tight sm:text-5xl md:text-7xl">
        Bienvenidos a Tesoria
      </h1>
      <p className="mt-7 max-w-2xl text-base leading-8 text-[#2E2E2E]/80 sm:text-lg">
        Ilumina tu hogar sin límites con nuestras velas recargables. Home deco,
        arte nostálgico.
      </p>
      <Link
        href="/#catalogo"
        className="mt-10 rounded-full border border-[#2E2E2E] bg-white/40 px-8 py-3 text-sm tracking-[0.18em] text-[#2E2E2E] uppercase backdrop-blur-sm transition hover:bg-[#2E2E2E] hover:text-white"
      >
        Ver Catálogo
      </Link>
    </section>
  );
}
