import { STORE } from "@/data/config";
import { formatPrice } from "@/data/products";
import { getProductsByIds } from "@/data/store";
import {
  computeTotals,
  isValidCoupon,
  PAYMENT_LABELS,
  SHIPPING_LABELS,
  toWhatsappNumber,
  type Order,
  type OrderLine,
  type PaymentMethod,
  type ShippingMethod,
} from "@/lib/order";

type OrderRequest = {
  items?: { id?: unknown; quantity?: unknown }[];
  customer?: Record<string, unknown>;
  shipping?: unknown;
  payment?: unknown;
  coupon?: unknown;
  website?: unknown; // campo trampa para bots
};

function text(value: unknown, max = 200) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function bad(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

function orderNumber() {
  const now = new Date();
  const date = now.toISOString().slice(2, 10).replace(/-/g, "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TES-${date}-${random}`;
}

export async function POST(request: Request) {
  let body: OrderRequest;
  try {
    body = await request.json();
  } catch {
    return bad("Pedido inválido.");
  }

  const shipping = body.shipping as ShippingMethod;
  const payment = body.payment as PaymentMethod;
  if (!(shipping in SHIPPING_LABELS)) return bad("Elegí un método de envío.");
  if (!(payment in PAYMENT_LABELS)) return bad("Elegí una forma de pago.");

  const customer = {
    name: text(body.customer?.name, 80),
    email: text(body.customer?.email, 120),
    phone: text(body.customer?.phone, 30),
    address: text(body.customer?.address, 160),
    city: text(body.customer?.city, 80),
    notes: text(body.customer?.notes, 500),
  };
  if (!customer.name || !customer.phone || !customer.email) {
    return bad("Completá nombre, email y teléfono.");
  }
  if (shipping === "envio" && (!customer.address || !customer.city)) {
    return bad("Completá la dirección de envío.");
  }

  // Los precios se toman del almacén, no de lo que manda el navegador.
  const requested = (body.items ?? []).flatMap((item) => {
    const quantity = Number(item.quantity);
    if (typeof item.id !== "string") return [];
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return [];
    return [{ id: item.id, quantity }];
  });
  const products = await getProductsByIds(requested.map((item) => item.id));
  const lines: OrderLine[] = products.flatMap((product) => {
    if (product.inStock === false) return [];
    const quantity = requested.find((item) => item.id === product.id)!.quantity;
    return [
      {
        id: product.id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity,
        features: product.features ?? [],
      },
    ];
  });
  if (lines.length === 0) return bad("El carrito está vacío.");

  const couponCode = text(body.coupon, 30);
  const coupon =
    couponCode && isValidCoupon(couponCode) ? couponCode.toUpperCase() : null;

  const order: Order = {
    number: orderNumber(),
    createdAt: new Date().toISOString(),
    customer,
    shipping,
    payment,
    coupon,
    lines,
    totals: computeTotals(lines, shipping, payment, coupon),
    nextCoupon: STORE.nextPurchaseCoupon,
  };

  // Los bots completan todos los campos, incluso el oculto: le respondemos
  // como si nada pero no le avisamos al dueño.
  if (!text(body.website)) {
    await notifyOwner(order);
  }

  return Response.json({ order });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function notifyOwner(order: Order) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.warn(
      `Pedido ${order.number} sin aviso: faltan TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID.`,
    );
    return;
  }

  const { customer, totals } = order;
  const e = escapeHtml;
  const lines = order.lines.map((line) => {
    const features = line.features
      .map((f) => `\n    · ${e(f.label)}: ${e(f.value)}`)
      .join("");
    return `• ${line.quantity} × <b>${e(line.name)}</b> — ${formatPrice(line.price * line.quantity)}${features}`;
  });

  const message = [
    `🕯️ <b>Nuevo pedido ${order.number}</b>`,
    "",
    ...lines,
    "",
    `Subtotal: ${formatPrice(totals.subtotal)}`,
    totals.discountLabel
      ? `Descuento ${e(totals.discountLabel)}: −${formatPrice(totals.discount)}`
      : null,
    `Envío: ${totals.shippingLabel}`,
    `<b>Total: ${formatPrice(totals.total)}</b>`,
    "",
    `👤 ${e(customer.name)}`,
    `📞 ${e(customer.phone)}`,
    `✉️ ${e(customer.email)}`,
    `🚚 ${SHIPPING_LABELS[order.shipping]}`,
    order.shipping === "envio"
      ? `📍 ${e(customer.address)}, ${e(customer.city)}`
      : null,
    `💳 ${PAYMENT_LABELS[order.payment]}`,
    customer.notes ? `📝 ${e(customer.notes)}` : null,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const clientWhatsapp = `https://wa.me/${toWhatsappNumber(customer.phone)}`;
  const firstName = customer.name.split(" ")[0];
  const dispatchText = `¡Hola ${firstName}! Tu pedido ${order.number} de ${STORE.name} ya está en camino 🚚✨ ¡Gracias por tu compra!`;
  const contactText = `¡Hola ${firstName}! Te escribimos de ${STORE.name} por tu pedido ${order.number}.`;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "📦 Avisar despacho por WhatsApp",
                  url: `${clientWhatsapp}?text=${encodeURIComponent(dispatchText)}`,
                },
              ],
              [
                {
                  text: "💬 Escribirle al cliente",
                  url: `${clientWhatsapp}?text=${encodeURIComponent(contactText)}`,
                },
              ],
            ],
          },
        }),
      },
    );
    if (!response.ok) {
      console.error(
        `Telegram rechazó el aviso del pedido ${order.number}:`,
        await response.text(),
      );
    }
  } catch (error) {
    // El pedido igual se confirma: el cliente tiene su comprobante.
    console.error(`No se pudo avisar el pedido ${order.number}:`, error);
  }
}
