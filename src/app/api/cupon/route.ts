import { checkCoupon } from "@/data/coupons";

// El checkout pregunta acá si un código sirve, sin ver la lista de cupones.
export async function POST(request: Request) {
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
