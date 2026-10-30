import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase";
import { featuredProducts, type Product } from "@/data/products";
import {
  LEGACY_PRODUCT_COLUMNS,
  PRODUCT_COLUMNS,
  rowToProduct,
  type ProductRow,
} from "@/data/productRow";
import type { ShippingZone } from "@/lib/order";
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

  const query = (columns: string) =>
    createPublicClient()
      .from("products")
      .select(columns)
      .eq("active", true)
      .order("featured", { ascending: false })
      .order("position")
      .order("name");

  let { data, error } = await query(PRODUCT_COLUMNS);
  // Columna nueva que todavía no se creó: se lee sin descripción.
  if (error?.code === "42703") ({ data, error } = await query(LEGACY_PRODUCT_COLUMNS));

  if (error || !data) {
    // Si la base no responde, mostramos el catálogo de respaldo
    console.error("No se pudo leer el almacén:", error?.message);
    return featuredProducts;
  }
  return (data as unknown as ProductRow[]).map(rowToProduct);
}

export async function getProduct(id: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find((product) => product.id === id) ?? null;
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

  const supabase = createPublicClient();
  const [{ data, error }, zones] = await Promise.all([
    supabase.from("site_settings").select(SETTINGS_COLUMNS).eq("id", 1).maybeSingle(),
    supabase
      .from("shipping_zones")
      .select("id, name, price")
      .eq("active", true)
      .order("position")
      .order("name"),
  ]);

  if (error || !data) {
    console.error("No se pudieron leer los ajustes:", error?.message);
    return DEFAULT_SETTINGS;
  }
  return rowToSettings(data as SettingsRow, (zones.data as ShippingZone[]) ?? []);
}
