"use server";

import { updateTag } from "next/cache";
import { createClientWithToken } from "@/lib/supabase";
import { PRODUCTS_TAG } from "@/data/store";

// Se llama desde el almacén después de guardar, para que la tienda
// muestre los cambios enseguida. Solo un admin puede pedirlo.
export async function refreshStore(accessToken: string) {
  const supabase = createClientWithToken(accessToken);
  const { data: userData, error: userError } =
    await supabase.auth.getUser(accessToken);
  if (userError || !userData.user?.email) {
    return { ok: false };
  }
  const { data: admin } = await supabase
    .from("admins")
    .select("email")
    .eq("email", userData.user.email)
    .maybeSingle();
  if (!admin) {
    return { ok: false };
  }
  updateTag(PRODUCTS_TAG);
  return { ok: true };
}
