import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// La URL y la clave publicable de Supabase son públicas por diseño (los
// permisos los controla la base con RLS), así que pueden ir en el código.
// Si algún día se cambia de proyecto, alcanza con definir estas variables en Vercel.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://rcboyxkkyafhiflzbroi.supabase.co";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_3Ty3Ev4kw9ABv_OfqaChkw__pPbmNnI";

export const PRODUCT_IMAGES_BUCKET = "productos";

// Cliente sin sesión, para leer el catálogo desde el servidor
export function createPublicClient() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Cliente con un token de usuario, para verificar quién llama a una acción
export function createClientWithToken(accessToken: string) {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

let browserClient: SupabaseClient | null = null;

// Cliente del navegador para el almacén: guarda la sesión del dueño
export function getBrowserClient() {
  if (!browserClient) {
    browserClient = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return browserClient;
}
