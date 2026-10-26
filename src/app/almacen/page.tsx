import type { Metadata } from "next";
import AlmacenPanel from "@/components/almacen/AlmacenPanel";

export const metadata: Metadata = {
  title: "Almacén | Tesoria",
  robots: { index: false, follow: false },
};

export default function AlmacenPage() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-16 md:px-8 md:py-20">
      <div className="mb-10 text-center">
        <h1 className="title-soft font-serif text-4xl md:text-5xl">Almacén</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#2E2E2E]/75">
          Pedidos, productos, textos y datos de la tienda en un solo lugar.
          Los cambios se ven en la web apenas los guardás.
        </p>
      </div>
      <AlmacenPanel />
    </section>
  );
}
