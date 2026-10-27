// Avisos a Google Analytics y al Píxel de Meta. Si no están configurados
// (faltan los IDs en Vercel), no hacen nada.

type Gtag = (...args: unknown[]) => void;
type Fbq = (...args: unknown[]) => void;

function tools() {
  const w = window as unknown as { gtag?: Gtag; fbq?: Fbq };
  return { gtag: w.gtag, fbq: w.fbq };
}

export function trackAddToCart(item: { id: string; name: string; price: number }) {
  const { gtag, fbq } = tools();
  gtag?.("event", "add_to_cart", {
    currency: "ARS",
    value: item.price,
    items: [{ item_id: item.id, item_name: item.name, price: item.price, quantity: 1 }],
  });
  fbq?.("track", "AddToCart", {
    currency: "ARS",
    value: item.price,
    content_ids: [item.id],
    content_type: "product",
  });
}

export function trackBeginCheckout(value: number) {
  const { gtag, fbq } = tools();
  gtag?.("event", "begin_checkout", { currency: "ARS", value });
  fbq?.("track", "InitiateCheckout", { currency: "ARS", value });
}

export function trackPurchase(order: {
  number: string;
  total: number;
  lines: { id: string; name: string; price: number; quantity: number }[];
}) {
  const { gtag, fbq } = tools();
  gtag?.("event", "purchase", {
    transaction_id: order.number,
    currency: "ARS",
    value: order.total,
    items: order.lines.map((line) => ({
      item_id: line.id,
      item_name: line.name,
      price: line.price,
      quantity: line.quantity,
    })),
  });
  fbq?.(
    "track",
    "Purchase",
    {
      currency: "ARS",
      value: order.total,
      content_ids: order.lines.map((line) => line.id),
      content_type: "product",
    },
    { eventID: order.number },
  );
}
