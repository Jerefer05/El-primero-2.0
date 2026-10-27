import { after } from "next/server";
import { STORE } from "@/data/config";
import { formatPrice } from "@/data/products";
import { getProductsByIds, getSettings } from "@/data/store";
import { checkCoupon } from "@/data/coupons";
import { createPublicClient, createSecretClient } from "@/lib/supabase";
import { allowRequest, ORDER_LIMIT } from "@/lib/rateLimit";
import {
  computeTotals,
  isValidEmail,
  isValidPhone,
  MAX_QUANTITY,
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
  zone?: unknown;
  website?: unknown; // campo trampa para bots
};

function text(value: unknown, max = 200) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function bad(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

// Tiempo para que el aviso por Telegram reintente después de responder.
export const maxDuration = 60;

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
  if (!isValidEmail(customer.email)) {
    return bad("Revisá el email, por ejemplo: hola@correo.com.");
  }
  if (!isValidPhone(customer.phone)) {
    return bad(
      "Revisá el WhatsApp: tiene que tener la característica, por ejemplo 11 2233 4455.",
    );
  }
  if (shipping === "envio" && (!customer.address || !customer.city)) {
    return bad("Completá la dirección de envío.");
  }

  // Los precios se toman del almacén, no de lo que manda el navegador.
  // Si el mismo producto llega dos veces, se suman las cantidades.
  const requested: { id: string; quantity: number }[] = [];
  for (const item of body.items ?? []) {
    const quantity = Number(item.quantity);
    if (typeof item.id !== "string") continue;
    if (!Number.isInteger(quantity) || quantity < 1) continue;
    const found = requested.find((r) => r.id === item.id);
    if (found) found.quantity += quantity;
    else requested.push({ id: item.id, quantity });
  }
  if (requested.some((item) => item.quantity > MAX_QUANTITY)) {
    return bad(
      `Podés pedir hasta ${MAX_QUANTITY} unidades de cada producto. Para más, escribinos por WhatsApp y lo coordinamos.`,
    );
  }
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
  const [coupon, settings] = await Promise.all([
    couponCode ? checkCoupon(couponCode) : null,
    getSettings(),
  ]);

  // Si hay zonas cargadas, el envío a domicilio necesita una.
  let zone = null;
  if (shipping === "envio" && settings.shippingZones.length > 0) {
    zone = settings.shippingZones.find((item) => item.id === body.zone) ?? null;
    if (!zone) return bad("Elegí la zona de envío.");
  }

  // Se cuentan solo los pedidos completos, para no frenar a quien se
  // equivocó en un dato y lo corrige.
  if (!(await allowRequest(request, ORDER_LIMIT))) {
    return Response.json(
      {
        error:
          "Recibimos varios pedidos seguidos desde tu conexión. Esperá un rato o escribinos por WhatsApp y lo terminamos por ahí.",
      },
      { status: 429 },
    );
  }

  const order: Order = {
    number: orderNumber(),
    createdAt: new Date().toISOString(),
    customer,
    shipping,
    payment,
    coupon: coupon?.code ?? null,
    shippingZone: zone?.name ?? "",
    lines,
    totals: computeTotals(lines, shipping, payment, {
      coupon,
      zone,
      freeShippingFrom: settings.freeShippingFrom,
    }),
    nextCoupon: STORE.nextPurchaseCoupon,
  };

  // Los bots completan todos los campos, incluso el oculto: le respondemos
  // como si nada pero no le avisamos al dueño.
  if (!text(body.website)) {
    await saveOrder(order);
    // El aviso sale después de responder: el cliente no espera a Telegram,
    // y si Telegram está saturado hay tiempo para reintentar.
    after(() => notifyOwner(order));
  }

  return Response.json({ order });
}

// Lo guarda para verlo y cambiarle el estado desde el almacén. Con la clave
// secreta configurada, solo este servidor puede guardar pedidos: nadie puede
// cargar uno salteándose la web.
async function saveOrder(order: Order) {
  const supabase = createSecretClient() ?? createPublicClient();
  // El número es fecha + 4 cifras al azar: si justo se repite, se saca otro.
  for (let attempt = 1; attempt <= 3; attempt++) {
    const { error } = await supabase.from("orders").insert(orderRow(order));
    if (!error) return;
    if (error.code === "23505" && attempt < 3) {
      order.number = orderNumber();
      continue;
    }
    // El pedido igual se confirma: el cliente tiene su comprobante y el aviso por Telegram.
    console.error(
      `No se pudo guardar el pedido ${order.number}:`,
      error.message,
    );
    return;
  }
}

function orderRow(order: Order) {
  const { customer } = order;
  return {
    number: order.number,
    created_at: order.createdAt,
    customer_name: customer.name,
    customer_email: customer.email,
    customer_phone: customer.phone,
    address: customer.address,
    city: customer.city,
    notes: customer.notes,
    shipping: order.shipping,
    payment: order.payment,
    coupon: order.coupon,
    shipping_zone: order.shippingZone ?? "",
    lines: order.lines,
    totals: order.totals,
    total: order.totals.total,
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const TELEGRAM_ATTEMPTS = 4;

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
      ? `📍 ${e(customer.address)}, ${e(customer.city)}${order.shippingZone ? ` (${e(order.shippingZone)})` : ""}`
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

  const payload = JSON.stringify({
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
  });

  // Telegram limita cuántos mensajes por minuto entran a un mismo chat. Si
  // responde "esperá N segundos" (429) o falla la conexión, reintentamos.
  // Si igual no sale, el pedido ya quedó guardado y se ve en el almacén.
  for (let attempt = 1; attempt <= TELEGRAM_ATTEMPTS; attempt++) {
    let waitSeconds = 2 ** attempt;
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        },
      );
      if (response.ok) return;
      const result = (await response.json().catch(() => ({}))) as {
        description?: string;
        parameters?: { retry_after?: number };
      };
      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt === TELEGRAM_ATTEMPTS) {
        console.error(
          `Telegram rechazó el aviso del pedido ${order.number}:`,
          response.status,
          result.description,
        );
        return;
      }
      waitSeconds = result.parameters?.retry_after ?? waitSeconds;
    } catch (error) {
      if (attempt === TELEGRAM_ATTEMPTS) {
        console.error(`No se pudo avisar el pedido ${order.number}:`, error);
        return;
      }
    }
    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(waitSeconds, 20) * 1000),
    );
  }
}
