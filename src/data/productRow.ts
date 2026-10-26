// Forma de un producto en la tabla `products` de Supabase.
// Se usa tanto en el servidor como en el almacén (navegador).
import { formatPrice, type Product } from "@/data/products";

export const PRODUCT_COLUMNS =
  "id, name, price, image, alt, category, in_stock, stock, position, caracteristicas, active, featured";

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
  caracteristicas: { label: string; value: string }[];
  active: boolean; // false = pausado, no se muestra en la tienda
  featured: boolean; // true = aparece primero, con cartel de "Destacado"
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
    features: row.caracteristicas ?? [],
    featured: row.featured,
  };
}
