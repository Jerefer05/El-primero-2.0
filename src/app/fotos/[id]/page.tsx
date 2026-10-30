import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import PhotoGallery from "@/components/PhotoGallery";
import { createPublicClient, ORDER_PHOTOS_BUCKET } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Fotos del pedido | Tesoria",
  robots: { index: false, follow: false },
};

// El layout lee la ruta del navegador (popup de descuento), así que esta
// página dinámica puede esperar a tenerla en vez de mostrar un esqueleto.
export const instant = false;

const ORDER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export default function OrderPhotosPage({ params }: PageProps<"/fotos/[id]">) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
      <div className="mb-10 text-center">
        <p className="mb-4 text-xs tracking-[0.22em] text-[#2E2E2E]/70 uppercase">
          Pedido personalizado
        </p>
        <h1 className="title-soft font-serif text-4xl md:text-5xl">Fotos del pedido</h1>
      </div>
      <Suspense
        fallback={<p className="text-center text-sm text-[#2E2E2E]/70">Cargando fotos…</p>}
      >
        <OrderPhotos params={params} />
      </Suspense>
    </section>
  );
}

async function OrderPhotos({ params }: Pick<PageProps<"/fotos/[id]">, "params">) {
  const { id } = await params;
  if (!ORDER_ID.test(id)) notFound();

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("fotos_del_pedido", { pedido: id });
  if (error) {
    return (
      <p className="text-center text-sm text-[#2E2E2E]/70">
        No pudimos cargar las fotos. Probá de nuevo en un rato.
      </p>
    );
  }
  const rows = (data ?? []) as { name: string; size: number }[];
  if (!rows.length) notFound();

  const photos = rows.map((row) => ({
    name: row.name.slice(id.length + 1),
    size: Number(row.size) || 0,
    url: supabase.storage.from(ORDER_PHOTOS_BUCKET).getPublicUrl(row.name).data.publicUrl,
  }));

  return <PhotoGallery orderId={id} photos={photos} />;
}
