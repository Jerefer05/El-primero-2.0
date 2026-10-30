import { checkCoupon } from "@/data/coupons";
import { allowRequest, COUPON_LIMIT } from "@/lib/rateLimit";

// El checkout pregunta acá si un código sirve, sin ver la lista de cupones.
export async function POST(request: Request) {
  // Que no se puedan probar códigos al azar hasta dar con uno.
  if (!(await allowRequest(request, COUPON_LIMIT))) {
    return Response.json(
      { error: "Probaste muchos códigos seguidos. Esperá unos minutos." },
      { status: 429 },
    );
  }
  let code = "";
  try {
    const body = (await request.json()) as { code?: unknown };
    code = typeof body.code === "string" ? body.code.slice(0, 40) : "";
  } catch {
    // cuerpo inválido: se trata como código vacío
  }
  const coupon = await checkCoupon(code);
  if (!coupon) {
    return Response.json(
      { error: "Ese código no es válido o ya venció." },
      { status: 404 },
    );
  }
  return Response.json({ coupon });
}
