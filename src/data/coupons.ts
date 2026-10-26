import { createPublicClient } from "@/lib/supabase";
import { normalizeCoupon, type AppliedCoupon } from "@/lib/order";

// Valida un cupón contra la base (activo y sin vencer). Solo en el servidor.
export async function checkCoupon(code: string): Promise<AppliedCoupon | null> {
  const normalized = normalizeCoupon(code);
  if (!/^[A-Z0-9]{3,20}$/.test(normalized)) return null;
  const { data, error } = await createPublicClient().rpc("check_coupon", {
    p_code: normalized,
  });
  if (error) {
    console.error("No se pudo validar el cupón:", error.message);
    return null;
  }
  const row = (data as AppliedCoupon[] | null)?.[0];
  return row ? { code: row.code, percent: row.percent } : null;
}
