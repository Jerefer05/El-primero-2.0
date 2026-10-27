import { SUPABASE_URL } from "@/lib/supabase";

// Fotos que suben los clientes para polaroids e impresiones. Cada pedido va en
// una carpeta con un UUID al azar; el link /fotos/<uuid> es lo que se manda
// por WhatsApp, como un WeTransfer pero dentro de la tienda.
export const PHOTO_ORDERS_BUCKET = "fotos-pedidos";
export const MAX_PHOTOS = 60;
export const MAX_PHOTO_BYTES = 25 * 1024 * 1024;

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function photoUrl(path: string, download = false) {
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  const base = `${SUPABASE_URL}/storage/v1/object/public/${PHOTO_ORDERS_BUCKET}/${encoded}`;
  return download ? `${base}?download=` : base;
}

// Nombre original sin el número de orden que le agregamos al subirla.
export function originalName(path: string) {
  return path.split("/").pop()!.replace(/^\d+-/, "");
}

export function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export type PhotoFile = { path: string; name: string; size: number };

// Lo que se guarda en <pedido>/pedido.json y muestra la página /fotos/<pedido>.
export type PhotoOrderManifest = {
  createdAt: string;
  customerName: string;
  product: string;
  size: string;
  quantity: string;
  photos: PhotoFile[];
};

export function manifestPath(orderId: string) {
  return `${orderId}/pedido.json`;
}
