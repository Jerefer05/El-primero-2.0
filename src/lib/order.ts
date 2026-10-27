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

// Lo que cambió en el almacén desde que el cliente armó el carrito.
export type CartChange =
  | { id: string; kind: "agotado" }
  | { id: string; kind: "precio"; price: number };

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
  shippingCost?: number; // los pedidos viejos no lo tienen
  total: number;
};

// Cupón ya validado contra la base (porcentaje entero, ej: 10 = 10% OFF)
export type AppliedCoupon = { code: string; percent: number };

export type ShippingZone = { id: string; name: string; price: number };

// Lo que cambia el total además de los productos
export type Pricing = {
  coupon: AppliedCoupon | null;
  zone: ShippingZone | null;
  freeShippingFrom: number; // 0 = nunca es gratis
};

export type Order = {
  number: string;
  createdAt: string;
  customer: OrderCustomer;
  shipping: ShippingMethod;
  payment: PaymentMethod;
  coupon: string | null;
  shippingZone?: string;
  lines: OrderLine[];
  totals: OrderTotals;
  nextCoupon: { code: string; percent: number };
};

// Tope de unidades por producto en un pedido. Para más, se coordina por WhatsApp.
export const MAX_QUANTITY = 99;

// Ignora espacios y mayúsculas: "vuelve 10" vale igual que "VUELVE10".
export function normalizeCoupon(code: string) {
  return code.replace(/\s+/g, "").toUpperCase();
}

// Un email con algo antes y después de la @ y un punto en el dominio.
export const EMAIL_PATTERN = "[^\\s@]+@[^\\s@]+\\.[^\\s@]+";

export function isValidEmail(email: string) {
  return new RegExp(`^${EMAIL_PATTERN}$`).test(email);
}

// Un WhatsApp necesita al menos 8 números (con o sin espacios, guiones o +54).
export const PHONE_PATTERN = "[^0-9]*([0-9][^0-9]*){8,}";

export function isValidPhone(phone: string) {
  return phone.replace(/\D/g, "").length >= 8;
}

// El cupón y el descuento en efectivo no se suman: se aplica el mayor.
// El envío se suma al final según la zona, salvo que llegue al envío gratis.
export function computeTotals(
  lines: Pick<OrderLine, "price" | "quantity">[],
  shipping: ShippingMethod,
  payment: PaymentMethod,
  pricing: Pricing,
): OrderTotals {
  const subtotal = lines.reduce(
    (sum, line) => sum + line.price * line.quantity,
    0,
  );

  const couponPercent = pricing.coupon ? pricing.coupon.percent / 100 : 0;
  const cashPercent = payment === "efectivo" ? STORE.cashDiscount : 0;
  const percent = Math.max(couponPercent, cashPercent);

  let discountLabel: string | null = null;
  if (percent > 0) {
    discountLabel =
      pricing.coupon && couponPercent >= cashPercent
        ? `Cupón ${pricing.coupon.code} (${pricing.coupon.percent}% OFF)`
        : `Pago en efectivo (${Math.round(cashPercent * 100)}% OFF)`;
  }
  const discount = Math.round(subtotal * percent);

  let shippingLabel = "Sin cargo";
  let shippingCost = 0;
  if (shipping === "envio") {
    if (pricing.freeShippingFrom > 0 && subtotal >= pricing.freeShippingFrom) {
      shippingLabel = "¡Gratis!";
    } else if (pricing.zone) {
      shippingCost = pricing.zone.price;
      shippingLabel =
        shippingCost === 0
          ? `${pricing.zone.name}: sin cargo`
          : `${pricing.zone.name}: $${shippingCost.toLocaleString("es-AR")}`;
    } else {
      shippingLabel = "A coordinar";
    }
  }

  return {
    subtotal,
    discountLabel,
    discount,
    shippingLabel,
    shippingCost,
    total: subtotal - discount + shippingCost,
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
