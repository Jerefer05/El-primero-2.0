import { Suspense } from "react";
import type { Metadata } from "next";
import PhotoOrderGallery from "@/components/PhotoOrderGallery";

// Cada link es distinto: la página se arma al pedirla, no se prerenderiza.
export const instant = false;

export const metadata: Metadata = {
  title: "Fotos del pedido | Tesoria",
  robots: { index: false, follow: false },
};

async function Gallery({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PhotoOrderGallery id={id} />;
}

export default function PhotoOrderPage({ params }: PageProps<"/fotos/[id]">) {
  return (
    <section className="mx-auto max-w-5xl px-5 py-16 md:px-8 md:py-24">
      <Suspense
        fallback={
          <p className="text-center text-sm text-[#2E2E2E]/70">Cargando fotos…</p>
        }
      >
        <Gallery params={params} />
      </Suspense>
    </section>
  );
}
