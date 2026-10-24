import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase";
import { featuredProducts, formatPrice, type Product } from "@/data/products";

export const PRODUCTS_TAG = "products";

export type ProductRow = {
  id: string;
  name: string;
  price: number;
  image: string;
  alt: string;
  category: Product["category"];
  in_stock: boolean;
  stock: number | null;
  position: number;
};

export function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    priceLabel: formatPrice(row.price),
    image: row.image,
    alt: row.alt || row.name,
    category: row.category,
    inStock: row.in_stock && row.stock !== 0,
  };
}

// Catálogo de la tienda, cargado desde el almacén (Supabase).
// Se guarda en caché y se renueva apenas el dueño guarda un cambio.
export async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheTag(PRODUCTS_TAG);
  cacheLife("hours");

  const { data, error } = await createPublicClient()
    .from("products")
    .select("id, name, price, image, alt, category, in_stock, stock, position")
    .order("position")
    .order("name");

  if (error || !data) {
    // Si la base no responde, mostramos el catálogo de respaldo
    console.error("No se pudo leer el almacén:", error?.message);
    return featuredProducts;
  }
  return (data as ProductRow[]).map(rowToProduct);
}
