import type { MetadataRoute } from "next";
import { getProducts } from "@/data/store";
import { SITE_URL } from "@/lib/site";

// Lista de páginas para que Google las encuentre.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/pedidos`, changeFrequency: "monthly", priority: 0.6 },
    ...products.map((product) => ({
      url: `${SITE_URL}/producto/${product.id}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
