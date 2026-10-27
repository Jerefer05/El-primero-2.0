import { createHash } from "node:crypto";
import { createSecretClient } from "@/lib/supabase";

// Límite de intentos por conexión, para que un bot no llene el almacén y el
// Telegram con pedidos. La cuenta se lleva en la base (así vale para todos
// los servidores de Vercel a la vez); si la base no responde o falta la clave
// secreta, se usa una cuenta en memoria que al menos frena ráfagas.

export type Limit = { name: string; max: number; windowSeconds: number };

export const ORDER_LIMIT: Limit = { name: "pedido", max: 5, windowSeconds: 3600 };
export const COUPON_LIMIT: Limit = { name: "cupon", max: 20, windowSeconds: 600 };

export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "desconocida"
  );
}

// La IP no se guarda tal cual: solo una huella que no se puede revertir.
function fingerprint(limit: Limit, ip: string) {
  const salt = process.env.SUPABASE_SECRET_KEY ?? "tesoria";
  return createHash("sha256")
    .update(`${limit.name}:${ip}:${salt}`)
    .digest("hex")
    .slice(0, 32);
}

const memory = new Map<string, number[]>();

function allowedInMemory(key: string, limit: Limit) {
  const now = Date.now();
  const since = now - limit.windowSeconds * 1000;
  const hits = (memory.get(key) ?? []).filter((time) => time > since);
  if (hits.length >= limit.max) {
    memory.set(key, hits);
    return false;
  }
  hits.push(now);
  memory.set(key, hits);
  if (memory.size > 5000) memory.clear(); // que no crezca sin fin
  return true;
}

// true si la conexión todavía puede intentar; cuenta este intento.
export async function allowRequest(request: Request, limit: Limit) {
  const key = fingerprint(limit, clientIp(request));
  const supabase = createSecretClient();
  if (supabase) {
    const { data, error } = await supabase.rpc("registrar_intento", {
      p_clave: key,
      p_max: limit.max,
      p_ventana_segundos: limit.windowSeconds,
    });
    if (!error) return data === true;
    console.error("No se pudo revisar el límite de intentos:", error.message);
  }
  return allowedInMemory(key, limit);
}
