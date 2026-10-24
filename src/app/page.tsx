import Link from "next/link";
import HeroCarousel from "@/components/HeroCarousel";
import ProductCard from "@/components/ProductCard";
import { featuredProducts } from "@/data/products";

const values = [
  {
    title: "Tranquilidad",
    description:
      "Una llama suave, aromas serenos y un rincón de calma para el ritmo de cada día.",
  },
  {
    title: "Experiencia sensorial",
    description:
      "Texturas, luz y perfume se encuentran para vestir el hogar con una atmósfera íntima.",
  },
  {
    title: "Autenticidad",
    description:
      "Hecho a mano, con paciencia y oficio. Cada pieza guarda un gesto único.",
  },
];

export default function Home() {
  return (
    <div>
      {/* 1. Hero */}
      <HeroCarousel />

      {/* 2. Catálogo destacado */}
      <section
        id="catalogo"
        className="mx-auto max-w-6xl scroll-mt-24 px-5 py-16 md:px-8 md:py-24"
      >
        <div className="mb-12 text-center">
          <h2 className="title-soft font-serif text-3xl md:text-4xl">
            Catálogo destacado
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#2E2E2E]/75">
            Tienda de velas. Agregá al carrito y finalizá la compra cuando
            quieras.
          </p>
        </div>
        {[
          { title: "Iluminación cálida", category: "velas" },
          { title: "Recargá tus velas y reutilizá", category: "recarga" },
        ].map((group) => (
          <div key={group.category} className="mt-12 first:mt-0">
            <h3 className="mb-6 text-center font-serif text-2xl text-[#2E2E2E]">
              {group.title}
            </h3>
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProducts
                .filter((product) => product.category === group.category)
                .map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
            </div>
          </div>
        ))}
      </section>

      {/* 3. Nuestra esencia */}
      <section className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-16">
        <div className="mb-12 text-center">
          <h2 className="title-soft font-serif text-3xl md:text-4xl">
            Nuestra esencia
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#2E2E2E]/75">
            Minimalismo cálido, armonía y un recuerdo que permanece.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {values.map((value) => (
            <article
              key={value.title}
              className="rounded-2xl border border-white/50 bg-white/35 px-7 py-10 shadow-whisper backdrop-blur-sm"
            >
              <h3 className="font-serif text-2xl text-[#2E2E2E]">{value.title}</h3>
              <p className="mt-4 text-sm leading-7 text-[#2E2E2E]/80">
                {value.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* 4. Pedidos con foto */}
      <section className="mx-auto max-w-6xl px-5 py-16 text-center md:px-8 md:py-24">
        <h2 className="title-soft font-serif text-3xl md:text-4xl">
          Transformá tus recuerdos en arte
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#2E2E2E]/75">
          Convertí tus fotos favoritas en polaroids únicas o impresiones de alta
          calidad. Cada pieza es hecha a mano con dedicación.
        </p>
        <Link
          href="/pedidos"
          className="mt-8 inline-flex rounded-full border border-[#2E2E2E] px-8 py-3 text-sm tracking-[0.18em] text-[#2E2E2E] uppercase transition hover:bg-[#2E2E2E] hover:text-white"
        >
          CREAR MI PIEZA ÚNICA
        </Link>
      </section>
    </div>
  );
}
