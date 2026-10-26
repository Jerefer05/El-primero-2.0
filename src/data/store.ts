import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase";
import { featuredProducts, type Product } from "@/data/products";
import { PRODUCT_COLUMNS, rowToProduct, type ProductRow } from "@/data/productRow";
import {
  DEFAULT_SETTINGS,
  rowToSettings,
  SETTINGS_COLUMNS,
  type SettingsRow,
  type SiteSettings,
} from "@/data/settings";

export const PRODUCTS_TAG = "products";
export const SETTINGS_TAG = "settings";

// Catálogo de la tienda, cargado desde el almacén (Supabase).
// Se guarda en caché y se renueva apenas el dueño guarda un cambio.
export async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheTag(PRODUCTS_TAG);
  cacheLife("hours");

  const { data, error } = await createPublicClient()
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("active", true)
    .order("position")
    .order("name");

  if (error || !data) {
    // Si la base no responde, mostramos el catálogo de respaldo
    console.error("No se pudo leer el almacén:", error?.message);
    return featuredProducts;
  }
  return (data as ProductRow[]).map(rowToProduct);
}

// Para el servidor (por ejemplo, recalcular precios de un pedido).
// Devuelve los productos en el mismo orden que los ids; los que no existen se omiten.
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const products = await getProducts();
  const byId = new Map(products.map((product) => [product.id, product]));
  return ids.flatMap((id) => byId.get(id) ?? []);
}

// Textos y datos de contacto editados en el almacén.
export async function getSettings(): Promise<SiteSettings> {
  "use cache";
  cacheTag(SETTINGS_TAG);
  cacheLife("hours");

  const { data, error } = await createPublicClient()
    .from("site_settings")
    .select(SETTINGS_COLUMNS)
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    console.error("No se pudieron leer los ajustes:", error?.message);
    return DEFAULT_SETTINGS;
  }
  return rowToSettings(data as SettingsRow);
}
