// Lógica del pedido compartida entre el checkout (navegador) y la API (servidor),
// así los totales que ve el cliente son los mismos que recibe el dueño.
import { STORE } from "@/data/config";
import type { Product } from "@/data/products";

export type ProductFeature = NonNullable<Product["features"]>[number];

export type ShippingMethod = "envio" | "retiro";
export type PaymentMethod = "transferencia" | "efectivo";

export const SHIPPING_LABELS: Record<ShippingMethod, string> = {
  envio: "Envío a domicilio",
  retiro: "Retiro (coordinamos punto de entrega)",
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  transferencia: "Transferencia bancaria",
  efectivo: `Efectivo (${Math.round(STORE.cashDiscount * 100)}% OFF)`,
};

export type OrderCustomer = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  notes: string;
};

export type OrderLine = {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  features: ProductFeature[];
};

export type OrderTotals = {
  subtotal: number;
  discountLabel: string | null;
  discount: number;
  shippingLabel: string;
  total: number;
};

export type Order = {
  number: string;
  createdAt: string;
  customer: OrderCustomer;
  shipping: ShippingMethod;
  payment: PaymentMethod;
  coupon: string | null;
  lines: OrderLine[];
  totals: OrderTotals;
  nextCoupon: { code: string; percent: number };
};

export function isValidCoupon(code: string) {
  return (
    code.trim().toUpperCase() === STORE.nextPurchaseCoupon.code.toUpperCase()
  );
}

// El cupón y el descuento en efectivo no se suman: se aplica el mayor.
export function computeTotals(
  lines: Pick<OrderLine, "price" | "quantity">[],
  shipping: ShippingMethod,
  payment: PaymentMethod,
  coupon: string | null,
): OrderTotals {
  const subtotal = lines.reduce(
    (sum, line) => sum + line.price * line.quantity,
    0,
  );

  const couponPercent =
    coupon && isValidCoupon(coupon) ? STORE.nextPurchaseCoupon.percent : 0;
  const cashPercent = payment === "efectivo" ? STORE.cashDiscount : 0;
  const percent = Math.max(couponPercent, cashPercent);

  let discountLabel: string | null = null;
  if (percent > 0) {
    discountLabel =
      couponPercent >= cashPercent
        ? `Cupón ${STORE.nextPurchaseCoupon.code} (${Math.round(couponPercent * 100)}% OFF)`
        : `Pago en efectivo (${Math.round(cashPercent * 100)}% OFF)`;
  }
  const discount = Math.round(subtotal * percent);

  let shippingLabel = "Sin cargo";
  if (shipping === "envio") {
    shippingLabel =
      subtotal >= STORE.freeShippingFrom ? "¡Gratis!" : "A coordinar";
  }

  return {
    subtotal,
    discountLabel,
    discount,
    shippingLabel,
    total: subtotal - discount,
  };
}

// Pasa un teléfono argentino al formato que usa wa.me (549 + característica + número).
export function toWhatsappNumber(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("54")) {
    return digits.startsWith("549") ? digits : `549${digits.slice(2)}`;
  }
  if (digits.startsWith("0")) digits = digits.slice(1);
  // Si escribieron el 15 (ej. 11 15 2233 4455), lo sacamos
  if (digits.length === 12) {
    const at = [2, 3, 4].find((i) => digits.slice(i, i + 2) === "15");
    if (at !== undefined) digits = digits.slice(0, at) + digits.slice(at + 2);
  }
  return `549${digits}`;
}

export const LAST_ORDER_KEY = "tesoria-last-order-v1";
