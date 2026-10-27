import type { Metadata } from "next";
import PhotoOrderForm from "@/components/PhotoOrderForm";

export const metadata: Metadata = {
  title: "Pedidos personalizados | Tesoria",
  description:
    "Encargá Polaroids e impresiones con tus fotos en calidad original.",
};

export default function PedidosPage() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
      <div className="mb-12 text-center">
        <p className="mb-4 text-xs tracking-[0.22em] text-[#2E2E2E]/70 uppercase">
          Fotos · Polaroid · Impresiones
        </p>
        <h1 className="title-soft font-serif text-4xl md:text-5xl">
          Pedidos personalizados
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#2E2E2E]/75">
          Subí tus fotos (todas las que quieras) y elegí el formato. Este flujo es
          independiente de la tienda de velas.
        </p>
      </div>
      <PhotoOrderForm />
    </section>
  );
}
