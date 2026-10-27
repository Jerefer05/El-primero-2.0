import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import { getProduct, getProducts } from "@/data/store";
import { SITE_URL } from "@/lib/site";

// Una página por producto, armada al publicar. Las que se agregan después
// desde el almacén se arman la primera vez que alguien las visita.
export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({ id: product.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/producto/[id]">): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return { title: "Producto no encontrado | Tesoria" };
  const description =
    product.description?.split("\n")[0].slice(0, 160) ||
    `${product.name} de Tesoria. ${product.priceLabel}.`;
  return {
    title: `${product.name} | Tesoria`,
    description,
    alternates: { canonical: `/producto/${product.id}` },
    openGraph: {
      title: `${product.name} | Tesoria`,
      description,
      images: [product.image],
      type: "website",
      locale: "es_AR",
      siteName: "Tesoria",
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/producto/[id]">) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const soldOut = product.inStock === false;
  const paragraphs = (product.description ?? "")
    .split(/\n\s*\n/)
    .map((text) => text.trim())
    .filter(Boolean);

  // Ficha para que Google muestre precio y disponibilidad en los resultados.
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: new URL(product.image, SITE_URL).toString(),
    description: product.description || product.alt,
    brand: { "@type": "Brand", name: "Tesoria" },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "ARS",
      availability: soldOut
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      url: `${SITE_URL}/producto/${product.id}`,
    },
  };

  return (
    <section className="mx-auto max-w-5xl px-5 py-12 md:px-8 md:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <Link
        href="/#catalogo"
        className="text-xs tracking-[0.18em] text-[#2E2E2E]/75 uppercase hover:text-[#2E2E2E]"
      >
        ← Volver al catálogo
      </Link>

      <div className="mt-8 grid gap-10 md:grid-cols-2 md:items-start">
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-[#d7cbbe] shadow-whisper">
          <Image
            src={product.image}
            alt={product.alt}
            fill
            priority
            sizes="(min-width: 768px) 45vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="space-y-6 rounded-3xl border border-white/50 bg-white/50 p-6 shadow-whisper backdrop-blur-sm sm:p-8">
          <div className="space-y-3">
            <h1 className="font-serif text-3xl text-[#2E2E2E] md:text-4xl">
              {product.name}
            </h1>
            <p className="text-xl text-[#2E2E2E]">{product.priceLabel}</p>
          </div>

          {paragraphs.length > 0 && (
            <div className="space-y-3 text-sm leading-7 text-[#2E2E2E]/85">
              {paragraphs.map((text, i) => (
                <p key={i} className="whitespace-pre-line">
                  {text}
                </p>
              ))}
            </div>
          )}

          {product.features && product.features.length > 0 && (
            <dl className="divide-y divide-[#2E2E2E]/10 border-y border-[#2E2E2E]/10 text-sm">
              {product.features.map((feature) => (
                <div key={feature.label} className="flex justify-between gap-4 py-2.5">
                  <dt className="text-[#2E2E2E]/70">{feature.label}</dt>
                  <dd className="text-right text-[#2E2E2E]">{feature.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {product.category === "velas" && (
            <p className="rounded-2xl bg-[#f4eee6]/80 px-4 py-3 text-sm leading-6 text-[#2E2E2E]/85">
              <strong className="font-medium">Es recargable:</strong> cuando se
              termina la cera, el vaso no se tira. Lo volvés a llenar con nuestra{" "}
              <Link href="/#catalogo" className="underline underline-offset-2">
                cera de recarga
              </Link>{" "}
              y queda como nueva.
            </p>
          )}

          <AddToCartButton product={product} soldOut={soldOut} />
        </div>
      </div>
    </section>
  );
}
